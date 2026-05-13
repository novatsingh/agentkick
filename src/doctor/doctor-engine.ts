import fs from "node:fs";
import path from "node:path";
import { readJsonSafe } from "../utils/fs.js";
import { detectProject } from "../detectors/project-detector.js";
import type { DetectionDebug, DoctorOptions, DoctorProblem, PackageJson } from "../core/types.js";
import { bullet, checkStatus, command, header, pathLabel, score, section, severity, status } from "../utils/ui.js";

type DoctorCheck = { ok: boolean; label: string; message: string };

type AgentkickConfig = {
  testCommand?: string;
  buildCommand?: string;
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
  problems: DoctorProblem[];
};

type DoctorAudit = {
  score: number;
  status: "ready" | "blocked" | "needs-review";
  detectedStack: string;
  detectedCapabilities: string[];
  detectionDebug: DetectionDebug;
  checks: DoctorCheck[];
  problems: DoctorProblem[];
  warnings: string[];
  failures: string[];
  suggestions: string[];
  analysis: WorkflowAnalysis;
};

const REQUIRED_AGENT_FILES = [
  ["AGENTS.md", "master repo intelligence"],
  ["CLAUDE.md", "Claude memory"],
  [".github/copilot-instructions.md", "Copilot root instructions"],
  [".github/instructions/security.instructions.md", "Copilot security instructions"],
  [".claude/skills/review/SKILL.md", "Claude review skill"],
  [".claude/skills/security-scan/SKILL.md", "Claude security skill"],
  [".agents/skills/review/SKILL.md", "generic review skill"],
  [".codex/agents/reviewer.md", "Codex reviewer agent"],
  [".cursor/rules/agentkick.mdc", "Cursor rules"],
  [".agentkick.json", "AgentKick config"]
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

const IGNORED_DIRS = new Set([
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

export function runDoctor(cwd: string, options: DoctorOptions = {}) {
  const audit = auditRepo(cwd);
  if (options.json) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    printAudit(audit, options);
  }
  if (options.strict && (audit.failures.length > 0 || audit.score < 85)) {
    process.exitCode = 1;
  }
}

function auditRepo(cwd: string): DoctorAudit {
  const packageInfo = readJsonSafe<PackageJson>(path.join(cwd, "package.json"));
  const config = readJsonSafe<AgentkickConfig>(path.join(cwd, ".agentkick.json"));
  const profile = detectProject(cwd);
  const checks = REQUIRED_AGENT_FILES.map(([file, label]) => requiredFile(cwd, file, label));
  const analysis = analyzeWorkflow(cwd, packageInfo, config);
  const warningProblems = analysis.problems.filter((problem) => problem.severity !== "high");
  const highProblems = analysis.problems.filter((problem) => problem.severity === "high");
  const warnings = warningProblems.map(problemMessage);
  const failures = checks.filter((check) => !check.ok).map((check) => check.message);
  const score = readinessScore(failures, analysis.problems);

  return {
    score,
    status: failures.length === 0 && score >= 85 ? "ready" : failures.length > 0 ? "blocked" : "needs-review",
    detectedStack: profile.primaryStack ?? profile.template,
    detectedCapabilities: profile.capabilities ?? [],
    detectionDebug: profile.detection ?? {
      cwd,
      primaryStack: profile.primaryStack ?? profile.template,
      capabilities: profile.capabilities ?? [],
      detected: profile.stack,
      workspaceHints: [],
      filesChecked: [],
      dependencies: [],
      configFiles: [],
      reasoning: []
    },
    checks,
    problems: analysis.problems,
    warnings: [...warnings, ...highProblems.map(problemMessage)],
    failures,
    suggestions: suggestionsFor(failures, analysis.problems),
    analysis
  };
}

function analyzeWorkflow(
  cwd: string,
  packageInfo: PackageJson | null,
  config: AgentkickConfig | null
): WorkflowAnalysis {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(file.extension));
  const reactFiles = sourceFiles.filter((file) => file.isReact);
  const problems: DoctorProblem[] = [
    ...memoryProblems(cwd),
    ...commandProblems(packageInfo, config),
    ...fileSizeProblems(sourceFiles),
    ...reactComponentProblems(reactFiles),
    ...modularityProblems(cwd, sourceFiles),
    ...tokenWasteProblems(cwd, files),
    ...taskIsolationProblems(cwd),
    ...mcpProblems(cwd),
    ...ciProblems(cwd)
  ];

  return {
    filesScanned: files.length,
    sourceFiles: sourceFiles.length,
    reactFiles: reactFiles.length,
    largestFiles: [...sourceFiles].sort((a, b) => b.lines - a.lines || b.bytes - a.bytes).slice(0, 8),
    problems
  };
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
        if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!SOURCE_EXTENSIONS.has(extension) && !isMemoryFile(relativePath)) continue;
      const stats = fs.statSync(fullPath);
      if (stats.size > 600_000) continue;
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

function memoryProblems(cwd: string): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  for (const file of WORKFLOW_MEMORY_FILES) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) {
      problems.push({
        severity: file === "AGENTS.md" ? "high" : "medium",
        category: "memory",
        title: `Missing workflow memory: ${file}`,
        file,
        detail: `${file} is part of the durable repo memory layer agents should read before editing.`,
        suggestion: "Run agentkick init or add the missing memory file with concise project rules."
      });
      continue;
    }
    const content = readFileSafe(fullPath);
    if (content.trim().length < 80) {
      problems.push({
        severity: "medium",
        category: "memory",
        title: `Thin workflow memory: ${file}`,
        file,
        detail: `${file} exists but is too small to carry useful agent context.`,
        suggestion: "Add purpose, boundaries, commands, and update rules in short markdown sections."
      });
    }
  }
  return problems;
}

function commandProblems(packageInfo: PackageJson | null, config: AgentkickConfig | null): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  const hasTest = Boolean(
    packageInfo?.scripts?.test || (config?.testCommand && !config.testCommand.startsWith("document "))
  );
  const hasBuild = Boolean(
    packageInfo?.scripts?.build || (config?.buildCommand && !config.buildCommand.startsWith("document "))
  );
  if (!hasTest) {
    problems.push({
      severity: "medium",
      category: "commands",
      title: "Missing test command",
      detail: "Agents cannot reliably verify changes without a known test command.",
      suggestion: "Add a package test script or document testCommand in .agentkick.json."
    });
  }
  if (!hasBuild) {
    problems.push({
      severity: "medium",
      category: "commands",
      title: "Missing build command",
      detail: "Agents may skip production verification when no build command is discoverable.",
      suggestion: "Add a build script or document buildCommand in .agentkick.json."
    });
  }
  return problems;
}

function fileSizeProblems(files: RepoFile[]): DoctorProblem[] {
  return files
    .filter((file) => file.lines >= 700 || file.bytes >= 60_000)
    .slice(0, 12)
    .map((file) => ({
      severity: file.lines >= 1200 || file.bytes >= 120_000 ? "high" : "medium",
      category: "file-size",
      title: "Giant file",
      file: file.relativePath,
      detail: `${file.relativePath} has ${file.lines} lines and is expensive for agents to load or edit safely.`,
      suggestion: "Split stable helpers, UI sections, and business logic into feature-scoped modules."
    }));
}

function reactComponentProblems(files: RepoFile[]): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  for (const file of files) {
    const content = readFileSafe(file.absolutePath);
    const hookCount = (content.match(/\buse[A-Z]\w*\(/g) ?? []).length;
    const jsxBlocks = (content.match(/return\s*\(/g) ?? []).length;
    if (file.lines >= 320 || hookCount >= 9 || jsxBlocks >= 6) {
      problems.push({
        severity: file.lines >= 600 || hookCount >= 14 ? "high" : "medium",
        category: "react-component",
        title: "Oversized React component",
        file: file.relativePath,
        detail: `${file.relativePath} has ${file.lines} lines, ${hookCount} hook calls, and ${jsxBlocks} JSX return blocks.`,
        suggestion: "Extract feature sections, hooks, data adapters, and presentational components."
      });
    }
  }
  return problems.slice(0, 12);
}

function modularityProblems(cwd: string, sourceFiles: RepoFile[]): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  const srcFiles = sourceFiles.filter((file) => file.relativePath.startsWith("src/"));
  const appFiles = sourceFiles.filter((file) => file.relativePath.startsWith("app/"));
  const topLevelSrcFiles = srcFiles.filter((file) => file.relativePath.split("/").length <= 2);
  const hasFeatureBoundary =
    directoryExists(cwd, "src/features") ||
    directoryExists(cwd, "features") ||
    (directoryExists(cwd, "src/commands") && directoryExists(cwd, "src/core") && directoryExists(cwd, "src/workflow"));
  const hasCoreBoundary = directoryExists(cwd, "src/core") || directoryExists(cwd, "core");

  if (sourceFiles.length >= 25 && !hasFeatureBoundary) {
    problems.push({
      severity: "medium",
      category: "modularity",
      title: "Missing feature boundaries",
      detail: "The repo has enough source files to need feature-scoped folders, but no feature boundary was found.",
      suggestion: "Add src/features/<feature-name> folders with local README files for agent scoping."
    });
  }

  if ((srcFiles.length >= 18 || appFiles.length >= 18) && !hasCoreBoundary) {
    problems.push({
      severity: "low",
      category: "modularity",
      title: "No core boundary",
      detail: "Shared behavior has no obvious home, which can lead to scattered helpers and duplicated logic.",
      suggestion: "Create src/core for stable framework-neutral primitives used by multiple features."
    });
  }

  if (topLevelSrcFiles.length >= 14) {
    problems.push({
      severity: "medium",
      category: "structure",
      title: "Flat source structure",
      detail: `${topLevelSrcFiles.length} files sit directly under src, making task scope harder to isolate.`,
      suggestion: "Group files by feature, surface, or workflow before adding more behavior."
    });
  }

  return problems;
}

function tokenWasteProblems(cwd: string, files: RepoFile[]): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  const generatedFolders = ["coverage", "storybook-static", "public/assets", "public/generated", "docs/generated"];
  for (const folder of generatedFolders) {
    if (directoryExists(cwd, folder)) {
      problems.push({
        severity: "low",
        category: "token-waste",
        title: "Generated or bulky assets in repo context",
        file: folder,
        detail: `${folder} exists and can pollute agent file searches if not excluded from task context.`,
        suggestion:
          "Document that agents should avoid this folder unless the task is explicitly about generated assets."
      });
    }
  }

  const longMarkdown = files
    .filter((file) => file.extension === ".md" && file.lines >= 400 && !file.relativePath.startsWith("docs/"))
    .slice(0, 5);
  for (const file of longMarkdown) {
    problems.push({
      severity: "low",
      category: "token-waste",
      title: "Long root-context markdown",
      file: file.relativePath,
      detail: `${file.relativePath} has ${file.lines} lines and may waste context during agent startup.`,
      suggestion: "Move durable reference material into docs/ and keep startup memory concise."
    });
  }

  return problems;
}

function taskIsolationProblems(cwd: string): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  const hasCurrentTask = fs.existsSync(path.join(cwd, "CURRENT_TASK.md"));
  const hasArchitecture = fs.existsSync(path.join(cwd, "ARCHITECTURE.md"));
  const hasProjectMap = fs.existsSync(path.join(cwd, "docs", "PROJECT_MAP.md"));
  if (hasCurrentTask) {
    const currentTask = readFileSafe(path.join(cwd, "CURRENT_TASK.md"));
    if (!/active scope|current task|status/i.test(currentTask)) {
      problems.push({
        severity: "low",
        category: "task-isolation",
        title: "Weak active task file",
        file: "CURRENT_TASK.md",
        detail: "CURRENT_TASK.md exists but does not clearly describe active scope or status.",
        suggestion: "Keep CURRENT_TASK.md focused on status, active scope, touched files, and verification."
      });
    }
  } else {
    problems.push({
      severity: "medium",
      category: "task-isolation",
      title: "No active task file",
      file: "CURRENT_TASK.md",
      detail: "Agents have no durable place to preserve the current task scope across chat resets.",
      suggestion: "Add CURRENT_TASK.md and keep it focused on the active execution boundary."
    });
  }
  if (!hasProjectMap && !hasArchitecture) {
    problems.push({
      severity: "medium",
      category: "task-isolation",
      title: "No project map",
      detail: "Agents must infer repo ownership from file names instead of a clear architecture map.",
      suggestion: "Add ARCHITECTURE.md or docs/PROJECT_MAP.md with the first files and boundaries to read."
    });
  }
  return problems;
}

function mcpProblems(cwd: string): DoctorProblem[] {
  const problems: DoctorProblem[] = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path.join(cwd, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const content = readFileSafe(fullPath);
    if (content.includes("C:\\\\") || (content.includes("/") && content.includes("filesystem"))) {
      problems.push({
        severity: "medium",
        category: "security",
        title: "Broad MCP filesystem access",
        file: fileName,
        detail: `${fileName} appears to expose broad filesystem access.`,
        suggestion: "Restrict MCP filesystem tools to this repository and use explicit allowlists."
      });
    }
    if (content.includes("*") && content.includes("command")) {
      problems.push({
        severity: "high",
        category: "security",
        title: "Wildcard MCP command access",
        file: fileName,
        detail: `${fileName} may allow broad command execution.`,
        suggestion: "Replace wildcard command access with narrow command prefixes."
      });
    }
  }
  return problems;
}

function ciProblems(cwd: string): DoctorProblem[] {
  const workflowDir = path.join(cwd, ".github", "workflows");
  if (fs.existsSync(workflowDir)) return [];
  return [
    {
      severity: "low",
      category: "ci",
      title: "No GitHub Actions workflow",
      detail: "Agents can still work, but there is no repo-native CI signal for handoff confidence.",
      suggestion: "Add a minimal CI workflow or run agentkick add github."
    }
  ];
}

function readinessScore(failures: string[], problems: DoctorProblem[]) {
  const weights = { high: 12, medium: 7, low: 3 } satisfies Record<DoctorProblem["severity"], number>;
  const problemPenalty = problems.reduce((total, problem) => total + weights[problem.severity], 0);
  return Math.max(0, Math.min(100, 100 - failures.length * 9 - problemPenalty));
}

function printAudit(audit: DoctorAudit, options: DoctorOptions) {
  console.log(header("AgentKick doctor", "AI workflow readiness for this repository."));
  console.log("");
  console.log(`AI Readiness Score: ${score(audit.score)}`);
  console.log(`Status: ${status(audit.status)}`);
  if (options.strict) console.log("Mode: strict");
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

  if (audit.problems.length > 0) {
    console.log(section("Problems:"));
    for (const problem of audit.problems) {
      const file = problem.file ? ` (${problem.file})` : "";
      console.log(bullet(`[${severity(problem.severity)}] ${problem.title}${file}`));
    }
    console.log("");
  }

  console.log(section("Workflow checks:"));
  for (const check of audit.checks) {
    console.log(`${checkStatus(check.ok)} ${check.label}: ${check.message}`);
  }

  if (audit.suggestions.length > 0) {
    console.log("");
    console.log(section("Suggested fixes:"));
    for (const suggestion of audit.suggestions) console.log(bullet(suggestion));
  }

  if (options.debug) {
    printDetectionDebug(audit.detectionDebug);
    printWorkflowDebug(audit.analysis);
  }
}

function requiredFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

function suggestionsFor(failures: string[], problems: DoctorProblem[]) {
  const suggestions: string[] = [];
  if (failures.some((item) => item.includes("AGENTS.md")))
    suggestions.push("Run agentkick init to regenerate the master repo intelligence layer.");
  if (failures.some((item) => item.includes(".claude/skills")))
    suggestions.push("Regenerate Claude skills with agentkick init.");
  if (failures.some((item) => item.includes(".codex/agents")))
    suggestions.push("Regenerate Codex specialist agents with agentkick init.");
  for (const problem of problems) suggestions.push(problem.suggestion);
  return [...new Set(suggestions)].slice(0, 10);
}

function problemMessage(problem: DoctorProblem) {
  return `${problem.title}${problem.file ? ` (${problem.file})` : ""}: ${problem.detail}`;
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

function slash(value: string) {
  return value.replace(/\\/g, "/");
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
