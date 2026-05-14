import fs from "node:fs";
import path from "node:path";
import type { DoctorPriority, DoctorProblem, PackageJson } from "../core/types.js";
import { SOURCE_EXTENSIONS, WORKFLOW_MEMORY_FILES } from "./constants.js";
import { scanRepoFiles } from "./scanner.js";
import type { AgentkickConfig, RepoFile, WorkflowAnalysis, WorkflowState } from "./types.js";
import { directoryExists, lineCount, pathCoveredByGuidance, readFileSafe, slug } from "./utils.js";

export function analysisFindings(
  cwd: string,
  packageInfo: PackageJson | null,
  config: AgentkickConfig | null,
  workflowState: WorkflowState | null,
  analysis: WorkflowAnalysis
) {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(file.extension));
  const reactFiles = sourceFiles.filter((file) => file.isReact);
  return [
    ...memoryFindings(cwd, analysis.missingMemoryFiles, workflowState),
    ...verificationFindings(packageInfo, config),
    ...generatedVendorFindings(cwd, analysis.generatedVendorPaths),
    ...sourceFileFindings(sourceFiles),
    ...reactFindings(reactFiles),
    ...modularityFindings(cwd, sourceFiles),
    ...taskStateFindings(cwd, workflowState),
    ...ciFindings(cwd)
  ].sort(compareFindings);
}

export function memoryFindings(
  cwd: string,
  missingFiles: string[],
  workflowState: WorkflowState | null
): DoctorProblem[] {
  const findings: DoctorProblem[] = [];
  if (!fs.existsSync(path.join(cwd, ".agentkick.json"))) {
    findings.push(
      finding({
        id: "memory.missing-agentkick-config",
        priority: "P0",
        category: "memory",
        title: "Missing AgentKick config",
        file: ".agentkick.json",
        signal: ".agentkick.json was not found at the repo root.",
        agentImpact: "Agents cannot share a stable project profile, verification command, or workflow metadata.",
        recommendation: "Run agentkick init to create the repo readiness layer.",
        autoFix: "safe-plan"
      })
    );
  }

  for (const file of missingFiles) {
    findings.push(
      finding({
        id: `memory.missing.${slug(file)}`,
        priority: file === "AGENTS.md" || file === "WORKFLOW_RULES.md" || file === ".agentkick.json" ? "P0" : "P1",
        category: file === "CURRENT_TASK.md" ? "continuity" : "memory",
        title: `Missing workflow memory: ${file}`,
        file,
        signal: `${file} was not found at the repo root.`,
        agentImpact:
          file === "CURRENT_TASK.md"
            ? "Task continuity breaks after a chat reset because active scope has no durable home."
            : "Agents must infer repo rules from chat history or source files.",
        recommendation: "Run agentkick init or add the missing file with concise agent-readable sections.",
        autoFix: "safe-plan"
      })
    );
  }

  for (const file of WORKFLOW_MEMORY_FILES) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = readFileSafe(fullPath);
    const lines = lineCount(content);
    if (content.trim().length < 80) {
      findings.push(
        finding({
          id: `memory.thin.${slug(file)}`,
          priority: "P2",
          category: "memory",
          title: `Thin workflow memory: ${file}`,
          file,
          signal: `${file} has less than 80 characters of usable content.`,
          agentImpact: "Agents get the file name but not enough rules, scope, or continuity to act reliably.",
          recommendation: "Add purpose, boundaries, commands, update rules, and current risks in short sections.",
          autoFix: "manual"
        })
      );
    }
    if (lines >= 350 || content.length >= 30_000) {
      findings.push(
        finding({
          id: `memory.oversized.${slug(file)}`,
          priority: "P2",
          category: "token-waste",
          title: `Oversized workflow memory: ${file}`,
          file,
          signal: `${file} has ${lines} lines and ${content.length} characters.`,
          agentImpact: "Agents will waste context loading durable memory that should be compact.",
          recommendation: "Compress old details into TASK_HISTORY.md or docs/ and keep startup memory concise.",
          autoFix: "manual"
        })
      );
    }
  }

  if (!workflowState) {
    findings.push(
      finding({
        id: "continuity.workflow-state-missing",
        priority: "P1",
        category: "continuity",
        title: "Missing workflow state",
        file: ".agentkick/workflow-state.json",
        signal: ".agentkick/workflow-state.json was not found.",
        agentImpact: "AgentKick cannot resume the active scope after a thread reset.",
        recommendation: "Run agentkick init, then use agentkick focus <scope> before handing work to an agent.",
        autoFix: "safe-plan"
      })
    );
  }

  return findings;
}

export function verificationFindings(packageInfo: PackageJson | null, config: AgentkickConfig | null): DoctorProblem[] {
  const findings: DoctorProblem[] = [];
  const scripts = packageInfo?.scripts ?? {};
  const configTest = config?.testCommand;
  const configBuild = config?.buildCommand;
  const hasTest = Boolean(scripts.test || (configTest && !configTest.startsWith("document ")));
  const hasBuild = Boolean(scripts.build || (configBuild && !configBuild.startsWith("document ")));

  if (!hasTest) {
    findings.push(
      finding({
        id: "workflow.missing-test-command",
        priority: "P1",
        category: "commands",
        title: "Missing verification command",
        signal: "No package test script or usable .agentkick.json testCommand was found.",
        agentImpact: "Agents cannot prove a change worked without guessing how to verify it.",
        recommendation: "Add a test script or document the narrowest useful testCommand in .agentkick.json.",
        autoFix: "manual"
      })
    );
  }

  if (!hasBuild) {
    findings.push(
      finding({
        id: "workflow.missing-build-command",
        priority: "P2",
        category: "commands",
        title: "Missing build command",
        signal: "No package build script or usable .agentkick.json buildCommand was found.",
        agentImpact: "Agents may skip production verification and hand back changes that do not build.",
        recommendation: "Add a build script or document buildCommand in .agentkick.json.",
        autoFix: "manual"
      })
    );
  }

  if (configTest && !configTest.startsWith("document ") && configTest.includes("npm") && !scripts.test) {
    findings.push(
      finding({
        id: "workflow.test-script-mismatch",
        priority: "P1",
        category: "commands",
        title: "Package script mismatch",
        signal: `.agentkick.json testCommand is "${configTest}" but package.json has no test script.`,
        agentImpact: "Agents will run a documented command that fails before checking behavior.",
        recommendation: "Add the missing package script or update .agentkick.json to the command that works.",
        autoFix: "manual"
      })
    );
  }

  if (configBuild && !configBuild.startsWith("document ") && configBuild.includes("npm") && !scripts.build) {
    findings.push(
      finding({
        id: "workflow.build-script-mismatch",
        priority: "P2",
        category: "commands",
        title: "Build script mismatch",
        signal: `.agentkick.json buildCommand is "${configBuild}" but package.json has no build script.`,
        agentImpact: "Agents may report build verification that cannot actually run.",
        recommendation: "Add the missing package script or update .agentkick.json buildCommand.",
        autoFix: "manual"
      })
    );
  }

  return findings;
}

export function generatedVendorFindings(cwd: string, paths: string[]): DoctorProblem[] {
  if (paths.length === 0) return [];
  const guidance = `${readFileSafe(path.join(cwd, "WORKFLOW_RULES.md"))}\n${readFileSafe(path.join(cwd, "AGENTS.md"))}`;
  const lowerGuidance = guidance.toLowerCase();
  return paths
    .filter((item) => !pathCoveredByGuidance(item, lowerGuidance))
    .slice(0, 8)
    .map((item) =>
      finding({
        id: `context.generated-exposed.${slug(item)}`,
        priority: ["node_modules", "dist", "build", "coverage"].includes(item) ? "P2" : "P3",
        category: "context-waste",
        title: "Generated/vendor path not excluded",
        file: item,
        signal: `${item}/ exists but is not named in AGENTS.md or WORKFLOW_RULES.md avoidance guidance.`,
        agentImpact: "Agents may waste file-search context in generated, dependency, or build output.",
        recommendation: `Add ${item}/ to workflow avoidance rules unless tasks should inspect it.`,
        autoFix: "safe-plan"
      })
    );
}

export function sourceFileFindings(files: RepoFile[]): DoctorProblem[] {
  return files
    .filter((file) => file.lines >= 700 || file.bytes >= 60_000)
    .slice(0, 12)
    .map((file) =>
      finding({
        id: `context.giant-file.${slug(file.relativePath)}`,
        priority: file.lines >= 1200 || file.bytes >= 120_000 ? "P1" : "P2",
        category: "context-waste",
        title: "Oversized source file",
        file: file.relativePath,
        signal: `${file.lines} lines, ${file.bytes} bytes.`,
        agentImpact: "Agents will load unrelated behavior to make a small scoped change.",
        recommendation: "Split stable helpers, UI sections, and business logic into feature-scoped modules.",
        autoFix: "manual"
      })
    );
}

export function reactFindings(files: RepoFile[]): DoctorProblem[] {
  const findings: DoctorProblem[] = [];
  for (const file of files) {
    const content = readFileSafe(file.absolutePath);
    const hookCount = (content.match(/\buse[A-Z]\w*\(/g) ?? []).length;
    const jsxBlocks = (content.match(/return\s*\(/g) ?? []).length;
    if (file.lines >= 320 || hookCount >= 9 || jsxBlocks >= 6) {
      findings.push(
        finding({
          id: `context.oversized-react.${slug(file.relativePath)}`,
          priority: file.lines >= 600 || hookCount >= 14 ? "P1" : "P2",
          category: "context-waste",
          title: "Oversized React component",
          file: file.relativePath,
          signal: `${file.lines} lines, ${hookCount} hook calls, ${jsxBlocks} JSX return blocks.`,
          agentImpact: "Small UI changes require loading unrelated state, effects, and view logic.",
          recommendation: "Extract feature sections, hooks, data adapters, and presentational components.",
          autoFix: "manual"
        })
      );
    }
  }
  return findings.slice(0, 12);
}

export function modularityFindings(cwd: string, sourceFiles: RepoFile[]): DoctorProblem[] {
  const findings: DoctorProblem[] = [];
  const srcFiles = sourceFiles.filter((file) => file.relativePath.startsWith("src/"));
  const topLevelSrcFiles = srcFiles.filter((file) => file.relativePath.split("/").length <= 2);
  const hasFeatureBoundary =
    directoryExists(cwd, "src/features") ||
    directoryExists(cwd, "features") ||
    (directoryExists(cwd, "src/commands") && directoryExists(cwd, "src/core") && directoryExists(cwd, "src/workflow"));
  const hasCoreBoundary = directoryExists(cwd, "src/core") || directoryExists(cwd, "core");

  if (sourceFiles.length >= 25 && !hasFeatureBoundary) {
    findings.push(
      finding({
        id: "scope.missing-feature-boundaries",
        priority: "P2",
        category: "execution-scope",
        title: "Missing feature boundaries",
        signal: `${sourceFiles.length} source files were found without an obvious feature boundary.`,
        agentImpact: "Execution scope is unclear; agents must infer ownership from file names.",
        recommendation: "Add feature folders or document boundaries in ARCHITECTURE.md and FEATURE_SUMMARIES.md.",
        autoFix: "manual"
      })
    );
  }

  if (srcFiles.length >= 18 && !hasCoreBoundary) {
    findings.push(
      finding({
        id: "scope.missing-core-boundary",
        priority: "P3",
        category: "execution-scope",
        title: "No core boundary",
        signal: `${srcFiles.length} files live under src without a shared core folder.`,
        agentImpact: "Reusable behavior can drift into scattered helpers and increase context needed for edits.",
        recommendation: "Create src/core for stable framework-neutral primitives used by multiple features.",
        autoFix: "manual"
      })
    );
  }

  if (topLevelSrcFiles.length >= 14) {
    findings.push(
      finding({
        id: "scope.flat-src",
        priority: "P2",
        category: "execution-scope",
        title: "Flat source structure",
        signal: `${topLevelSrcFiles.length} files sit directly under src/.`,
        agentImpact: "Task boundaries are harder to isolate and focused prompts become less reliable.",
        recommendation: "Group files by feature, surface, or workflow before adding more behavior.",
        autoFix: "manual"
      })
    );
  }

  return findings;
}

export function taskStateFindings(cwd: string, workflowState: WorkflowState | null): DoctorProblem[] {
  const findings: DoctorProblem[] = [];
  const currentTaskPath = path.join(cwd, "CURRENT_TASK.md");
  if (!fs.existsSync(currentTaskPath)) return findings;

  const currentTask = readFileSafe(currentTaskPath);
  if (!/active scope|current task|status/i.test(currentTask)) {
    findings.push(
      finding({
        id: "continuity.weak-current-task",
        priority: "P2",
        category: "continuity",
        title: "Weak active task file",
        file: "CURRENT_TASK.md",
        signal: "CURRENT_TASK.md does not clearly describe status or active scope.",
        agentImpact: "Workflow cannot be resumed cleanly after a thread reset.",
        recommendation: "Keep CURRENT_TASK.md focused on status, active scope, touched files, and verification.",
        autoFix: "safe-plan"
      })
    );
  }

  if (workflowState?.updatedAt && workflowState.activeScope && workflowState.activeScope !== "none") {
    const ageMs = Date.now() - new Date(workflowState.updatedAt).getTime();
    const days = ageMs / 86_400_000;
    if (Number.isFinite(days) && days >= 14) {
      findings.push(
        finding({
          id: "continuity.stale-workflow-state",
          priority: "P2",
          category: "continuity",
          title: "Stale workflow state",
          file: ".agentkick/workflow-state.json",
          signal: `Active scope "${workflowState.activeScope}" was last updated ${Math.floor(days)} days ago.`,
          agentImpact: "Agents may resume old context and work from a stale execution boundary.",
          recommendation:
            "Run agentkick summarize, clear the active task, or run agentkick focus <scope> for current work.",
          autoFix: "manual"
        })
      );
    }
  }

  return findings;
}

export function ciFindings(cwd: string): DoctorProblem[] {
  if (fs.existsSync(path.join(cwd, ".github", "workflows"))) return [];
  return [
    finding({
      id: "workflow.no-ci",
      priority: "P3",
      category: "ci",
      title: "No repo-native CI signal",
      signal: ".github/workflows was not found.",
      agentImpact: "Agents can still work, but handoff confidence depends on local commands only.",
      recommendation: "Add a minimal CI workflow or run agentkick add github.",
      autoFix: "safe-plan"
    })
  ];
}

export function suggestionsFor(findings: DoctorProblem[]) {
  return [...new Set(findings.map((finding) => finding.recommendation))].slice(0, 10);
}

export function findingMessage(finding: DoctorProblem) {
  return `${finding.priority} ${finding.title}${finding.file ? ` (${finding.file})` : ""}: ${finding.signal}`;
}

export function nextCommandFor(findings: DoctorProblem[]) {
  if (
    findings.some(
      (finding) => finding.priority === "P0" && (finding.category === "memory" || finding.category === "continuity")
    )
  ) {
    return "agentkick init --dry-run";
  }
  if (findings.some((finding) => finding.category === "context-waste")) return "agentkick split-task <task>";
  return "agentkick focus <scope>";
}

export function finding(input: DoctorProblem): DoctorProblem {
  return input;
}

export function compareFindings(a: DoctorProblem, b: DoctorProblem) {
  const order: Record<DoctorPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return (
    order[a.priority] - order[b.priority] || a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
  );
}
