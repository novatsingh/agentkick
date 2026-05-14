import fs from "node:fs";
import path from "node:path";
import { readJsonSafe } from "../utils/fs.js";
import { detectProject } from "../detectors/project-detector.js";
import type { DetectionDebug, DoctorOptions, DoctorPriority, DoctorProblem, PackageJson } from "../core/types.js";
import { bullet, checkStatus, command, header, keyValue, pathLabel, score, section, status } from "../utils/ui.js";

type DoctorCheck = { ok: boolean; label: string; message: string };

type AgentkickConfig = {
  testCommand?: string;
  buildCommand?: string;
};

type WorkflowState = {
  activeScope?: string;
  updatedAt?: string;
  scopedFiles?: string[];
};

type RepoFile = {
  relativePath: string;
  absolutePath: string;
  extension: string;
  bytes: number;
  lines: number;
  isReact: boolean;
};

type WorkflowAnalysis = {
  filesScanned: number;
  sourceFiles: number;
  reactFiles: number;
  largestFiles: RepoFile[];
  generatedVendorPaths: string[];
  missingMemoryFiles: string[];
  contextWasteZones: DoctorProblem[];
};

type DoctorAudit = {
  schemaVersion: 1;
  command: "doctor";
  score: number;
  status: "ready" | "blocked" | "needs-review";
  detectedStack: string;
  detectedCapabilities: string[];
  verificationCommand: string;
  buildCommand: string;
  nextCommand: string;
  findings: DoctorProblem[];
  generatedVendorPaths: string[];
  missingMemoryFiles: string[];
  checks: DoctorCheck[];
  warnings: string[];
  failures: string[];
  suggestions: string[];
  detectionDebug: DetectionDebug;
  analysis: WorkflowAnalysis;
};

const REQUIRED_AGENT_FILES = [
  ["AGENTS.md", "agent operating rules"],
  ["WORKFLOW_RULES.md", "workflow rules"],
  [".agentkick.json", "AgentKick config"]
] as const;

const OPTIONAL_AGENT_FILES = [
  ["CLAUDE.md", "Claude memory"],
  [".github/copilot-instructions.md", "Copilot root instructions"],
  [".cursor/rules/agentkick.mdc", "Cursor rules"]
] as const;

const WORKFLOW_MEMORY_FILES = [
  "AGENTS.md",
  "CURRENT_TASK.md",
  "ARCHITECTURE.md",
  "FEATURE_SUMMARIES.md",
  "WORKFLOW_RULES.md",
  "DECISIONS.md",
  "TASK_HISTORY.md"
] as const;

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".py",
  ".go",
  ".rs",
  ".php"
]);

const SCAN_IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".netlify",
  ".cache",
  "coverage",
  "dist",
  "build",
  "out",
  "node_modules",
  "vendor",
  "target",
  "__pycache__"
]);

const GENERATED_VENDOR_CANDIDATES = [
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
  "target",
  "vendor",
  "release",
  "storybook-static",
  "public/generated",
  "docs/generated"
];

export function runDoctor(cwd: string, options: DoctorOptions = {}) {
  const audit = auditRepo(cwd);
  if (options.json) {
    console.log(JSON.stringify(jsonAudit(audit), null, 2));
  } else {
    printAudit(audit, options);
  }
  if (options.strict && (audit.findings.some((finding) => finding.priority === "P0") || audit.score < 85)) {
    process.exitCode = 1;
  }
}

function auditRepo(cwd: string): DoctorAudit {
  const packageInfo = readJsonSafe<PackageJson>(path.join(cwd, "package.json"));
  const config = readJsonSafe<AgentkickConfig>(path.join(cwd, ".agentkick.json"));
  const workflowState = readJsonSafe<WorkflowState>(path.join(cwd, ".agentkick", "workflow-state.json"));
  const profile = detectProject(cwd);
  const checks = [
    ...REQUIRED_AGENT_FILES.map(([file, label]) => requiredFile(cwd, file, label)),
    ...OPTIONAL_AGENT_FILES.map(([file, label]) => optionalFile(cwd, file, label))
  ];
  const verificationCommand = commandFor(profile.testCommand, "test", packageInfo?.scripts?.test);
  const buildCommand = commandFor(profile.buildCommand, "build", packageInfo?.scripts?.build);
  const analysis = analyzeWorkflow(cwd, packageInfo, config, workflowState);
  const findings = analysisFindings(cwd, packageInfo, config, workflowState, analysis);
  const failures = checks.filter((check) => !check.ok).map((check) => check.message);
  const scoreValue = readinessScore(findings);
  const statusValue = statusFor(scoreValue, findings);

  return {
    schemaVersion: 1,
    command: "doctor",
    score: scoreValue,
    status: statusValue,
    detectedStack: profile.primaryStack ?? profile.template,
    detectedCapabilities: profile.capabilities ?? [],
    verificationCommand,
    buildCommand,
    nextCommand: nextCommandFor(findings),
    findings,
    generatedVendorPaths: analysis.generatedVendorPaths,
    missingMemoryFiles: analysis.missingMemoryFiles,
    checks,
    warnings: findings.filter((finding) => finding.priority !== "P0").map(findingMessage),
    failures: [...failures, ...findings.filter((finding) => finding.priority === "P0").map(findingMessage)],
    suggestions: suggestionsFor(findings),
    detectionDebug:
      profile.detection ?? fallbackDetection(cwd, profile.primaryStack ?? profile.template, profile.stack),
    analysis
  };
}

function analyzeWorkflow(
  cwd: string,
  packageInfo: PackageJson | null,
  config: AgentkickConfig | null,
  workflowState: WorkflowState | null
): WorkflowAnalysis {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(file.extension));
  const reactFiles = sourceFiles.filter((file) => file.isReact);
  const generatedVendorPaths = GENERATED_VENDOR_CANDIDATES.filter((candidate) => directoryExists(cwd, candidate));
  const missingMemoryFiles = WORKFLOW_MEMORY_FILES.filter((file) => !fs.existsSync(path.join(cwd, file)));
  const preliminary = [
    ...memoryFindings(cwd, missingMemoryFiles, workflowState),
    ...verificationFindings(packageInfo, config),
    ...generatedVendorFindings(cwd, generatedVendorPaths),
    ...sourceFileFindings(sourceFiles),
    ...reactFindings(reactFiles),
    ...modularityFindings(cwd, sourceFiles),
    ...taskStateFindings(cwd, workflowState),
    ...ciFindings(cwd)
  ];

  return {
    filesScanned: files.length,
    sourceFiles: sourceFiles.length,
    reactFiles: reactFiles.length,
    largestFiles: [...sourceFiles].sort((a, b) => b.lines - a.lines || b.bytes - a.bytes).slice(0, 8),
    generatedVendorPaths,
    missingMemoryFiles,
    contextWasteZones: preliminary.filter((finding) =>
      ["context-waste", "token-waste", "file-size", "react-component"].includes(finding.category)
    )
  };
}

function analysisFindings(
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

function scanRepoFiles(cwd: string) {
  const results: RepoFile[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = slash(path.relative(cwd, fullPath));
      if (entry.isDirectory()) {
        if (!SCAN_IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!SOURCE_EXTENSIONS.has(extension) && !isMemoryFile(relativePath)) continue;
      const stats = fs.statSync(fullPath);
      if (stats.size > 700_000) continue;
      const content = readFileSafe(fullPath);
      results.push({
        relativePath,
        absolutePath: fullPath,
        extension,
        bytes: stats.size,
        lines: lineCount(content),
        isReact: extension === ".tsx" || extension === ".jsx"
      });
    }
  };
  walk(cwd);
  return results;
}

function memoryFindings(cwd: string, missingFiles: string[], workflowState: WorkflowState | null): DoctorProblem[] {
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

function verificationFindings(packageInfo: PackageJson | null, config: AgentkickConfig | null): DoctorProblem[] {
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

function generatedVendorFindings(cwd: string, paths: string[]): DoctorProblem[] {
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

function sourceFileFindings(files: RepoFile[]): DoctorProblem[] {
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

function reactFindings(files: RepoFile[]): DoctorProblem[] {
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

function modularityFindings(cwd: string, sourceFiles: RepoFile[]): DoctorProblem[] {
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

function taskStateFindings(cwd: string, workflowState: WorkflowState | null): DoctorProblem[] {
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

function ciFindings(cwd: string): DoctorProblem[] {
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

function readinessScore(findings: DoctorProblem[]) {
  const weights: Record<DoctorPriority, number> = { P0: 22, P1: 12, P2: 6, P3: 2 };
  const penalty = findings.reduce((total, finding) => total + weights[finding.priority], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function statusFor(scoreValue: number, findings: DoctorProblem[]) {
  if (findings.some((finding) => finding.priority === "P0")) return "blocked";
  if (scoreValue >= 85) return "ready";
  return "needs-review";
}

function printAudit(audit: DoctorAudit, options: DoctorOptions) {
  console.log(header("AgentKick doctor", "AI workflow readiness for this repository."));
  console.log("");
  console.log(`AI Readiness Score: ${score(audit.score)}`);
  console.log(`Status: ${status(audit.status)}`);
  if (options.strict) console.log("Mode: strict");
  console.log(keyValue("Verification", audit.verificationCommand));
  console.log(keyValue("Build", audit.buildCommand));
  console.log("");

  console.log(section("Detected stack:"));
  if (audit.detectedStack === "generic") {
    console.log(bullet("generic"));
    console.log(command("Could not confidently detect stack. Run agentkick doctor --debug to see checked files."));
    printWorkspaceHints(audit.detectionDebug);
  } else {
    for (const item of [audit.detectedStack, ...audit.detectedCapabilities]) console.log(bullet(item));
  }
  console.log("");

  printFindingBlock("Top 3 risks:", audit.findings.slice(0, 3));
  printFindingBlock("Top context waste zones:", audit.analysis.contextWasteZones.slice(0, 5));
  printMissingMemory(audit);

  console.log(section("Generated/vendor paths detected:"));
  if (audit.generatedVendorPaths.length === 0) console.log(bullet("none"));
  for (const item of audit.generatedVendorPaths) console.log(bullet(pathLabel(item)));
  console.log("");

  console.log(section("Workflow checks:"));
  for (const check of audit.checks) {
    console.log(`${checkStatus(check.ok)} ${check.label}: ${check.message}`);
  }

  if (audit.suggestions.length > 0) {
    console.log("");
    console.log(section("Suggested fixes:"));
    for (const suggestion of audit.suggestions.slice(0, 6)) console.log(bullet(suggestion));
  }

  console.log("");
  console.log(keyValue("Next", command(audit.nextCommand)));

  if (options.debug) {
    printDetectionDebug(audit.detectionDebug);
    printWorkflowDebug(audit.analysis);
  }
}

function printFindingBlock(title: string, findings: DoctorProblem[]) {
  console.log(section(title));
  if (findings.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const finding of findings) {
    const file = finding.file && !finding.title.includes(finding.file) ? ` ${pathLabel(finding.file)}` : "";
    console.log(bullet(`${finding.priority} ${finding.category}: ${finding.title}${file}`));
    console.log(`  ${keyValue("Signal", finding.signal)}`);
    console.log(`  ${keyValue("Agent impact", finding.agentImpact)}`);
    console.log(`  ${keyValue("Fix", finding.recommendation)}`);
  }
  console.log("");
}

function printMissingMemory(audit: DoctorAudit) {
  console.log(section("Missing memory/workflow files:"));
  if (audit.missingMemoryFiles.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const item of audit.missingMemoryFiles) console.log(bullet(item));
  console.log("");
}

function requiredFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

function optionalFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: true, label, message: `optional: ${relativePath} not present` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

function suggestionsFor(findings: DoctorProblem[]) {
  return [...new Set(findings.map((finding) => finding.recommendation))].slice(0, 10);
}

function findingMessage(finding: DoctorProblem) {
  return `${finding.priority} ${finding.title}${finding.file ? ` (${finding.file})` : ""}: ${finding.signal}`;
}

function nextCommandFor(findings: DoctorProblem[]) {
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

function pathCoveredByGuidance(item: string, guidance: string) {
  const lower = item.toLowerCase();
  if (guidance.includes(lower)) return true;
  if (["dist", "build", "out", ".next", ".turbo", "coverage", "release"].includes(lower)) {
    return guidance.includes("generated") || guidance.includes("build");
  }
  if (["node_modules", "vendor", "target"].includes(lower)) {
    return guidance.includes("vendor") || guidance.includes("dependency");
  }
  return false;
}

function commandFor(profileCommand: string, scriptName: "test" | "build", packageScript?: string) {
  if (profileCommand && !profileCommand.startsWith("document ")) return profileCommand;
  if (packageScript) return scriptName === "test" ? "npm test" : "npm run build";
  return "not detected";
}

function jsonAudit(audit: DoctorAudit) {
  return {
    schemaVersion: audit.schemaVersion,
    command: audit.command,
    score: audit.score,
    status: audit.status,
    detectedStack: {
      primary: audit.detectedStack,
      capabilities: audit.detectedCapabilities
    },
    verificationCommand: audit.verificationCommand,
    buildCommand: audit.buildCommand,
    nextCommand: audit.nextCommand,
    findings: audit.findings,
    generatedVendorPaths: audit.generatedVendorPaths,
    missingMemoryFiles: audit.missingMemoryFiles,
    checks: audit.checks,
    warnings: audit.warnings,
    failures: audit.failures
  };
}

function finding(input: DoctorProblem): DoctorProblem {
  return input;
}

function compareFindings(a: DoctorProblem, b: DoctorProblem) {
  const order: Record<DoctorPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return (
    order[a.priority] - order[b.priority] || a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
  );
}

function readFileSafe(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function lineCount(content: string) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

function directoryExists(cwd: string, relativePath: string) {
  try {
    return fs.statSync(path.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}

function isMemoryFile(relativePath: string) {
  return relativePath.endsWith(".md") || relativePath === ".agentkick.json";
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "root"
  );
}

function slash(value: string) {
  return value.replace(/\\/g, "/");
}

function fallbackDetection(cwd: string, stack: string, detected: string[]): DetectionDebug {
  return {
    cwd,
    primaryStack: stack,
    capabilities: [],
    detected,
    workspaceHints: [],
    filesChecked: [],
    dependencies: [],
    configFiles: [],
    reasoning: []
  };
}

function printDetectionDebug(detection: DetectionDebug) {
  console.log("");
  console.log(section("Stack detection debug:"));
  console.log(`Current working directory: ${detection.cwd}`);
  console.log("Files checked:");
  printList(detection.filesChecked);
  console.log("package.json dependencies found:");
  printList(detection.dependencies);
  console.log("Config files found:");
  printList(detection.configFiles);
  console.log("Final detection reasoning:");
  printList(detection.reasoning);
}

function printWorkflowDebug(analysis: WorkflowAnalysis) {
  console.log("");
  console.log(section("Workflow analysis debug:"));
  console.log(`Files scanned: ${analysis.filesScanned}`);
  console.log(`Source files scanned: ${analysis.sourceFiles}`);
  console.log(`React files scanned: ${analysis.reactFiles}`);
  console.log("Largest source files:");
  if (analysis.largestFiles.length === 0) {
    console.log("- none");
    return;
  }
  for (const file of analysis.largestFiles) {
    console.log(bullet(`${pathLabel(file.relativePath)} (${file.lines} lines, ${file.bytes} bytes)`));
  }
}

function printWorkspaceHints(detection: DetectionDebug) {
  if (detection.workspaceHints.length === 0) return;

  console.log("");
  console.log(section("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of detection.workspaceHints.slice(0, 5)) {
    console.log(`  ${command(`cd ${hint.path}`)}  # ${hint.stack}`);
  }
}

function printList(items: string[]) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(bullet(item));
}
