import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { detectProject } from "../detectors/project-detector.js";
import type { ProjectProfile } from "../core/types.js";
import { json, readJsonSafe, writeFile } from "../utils/fs.js";
import { gitBranch } from "../utils/git.js";

type ScopedFile = {
  path: string;
  reason: string;
  lines: number;
  exists: boolean;
};

type WorkflowState = {
  schemaVersion: 1;
  project: string;
  activeScope: string;
  task?: string;
  feature?: string;
  updatedAt: string;
  stack: string[];
  scopedFiles: string[];
};

type FocusInput =
  | string
  | {
      scope?: string;
      files?: string[];
      feature?: string;
      task?: string;
    };

type WorkflowSummaryInput =
  | string
  | {
      scope?: string;
      task?: string;
      handoff?: boolean;
      status?: SummaryStatus;
    };

type SummaryStatus = "complete" | "blocked" | "handoff";

const MEMORY_FILES = [
  "AGENTS.md",
  "CURRENT_TASK.md",
  "ARCHITECTURE.md",
  "FEATURE_SUMMARIES.md",
  "WORKFLOW_RULES.md",
  "DECISIONS.md",
  "TASK_HISTORY.md"
];

const ALWAYS_LOAD = ["AGENTS.md", "CURRENT_TASK.md", "ARCHITECTURE.md", "FEATURE_SUMMARIES.md", "WORKFLOW_RULES.md"];

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".json",
  ".md",
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
  ".agentkick",
  "coverage",
  "dist",
  "build",
  "out",
  "node_modules",
  "vendor",
  "target",
  "__pycache__"
]);

export function buildFocusContext(cwd: string, input: FocusInput = "current task") {
  const profile = detectProject(cwd);
  const focus = normalizeFocusInput(input);
  const explicitFiles = normalizeFileHints(focus.files ?? []);
  const scopedFiles =
    explicitFiles.length > 0 ? findExplicitScopedFiles(cwd, explicitFiles) : findScopedFiles(cwd, focus.scope);
  const uncertainty = uncertaintyFor(focus, scopedFiles, explicitFiles);
  updateCurrentTask(cwd, profile, focus, scopedFiles, uncertainty);
  writeWorkflowState(cwd, profile, focus, scopedFiles);

  return {
    profile,
    task: focus.task,
    feature: focus.feature,
    scope: focus.scope,
    explicitFiles,
    loadFirst: existing(cwd, ALWAYS_LOAD),
    avoidPaths: avoidPathsFor(cwd),
    scopedFiles,
    memoryFiles: existing(cwd, MEMORY_FILES),
    memory: memoryDigest(cwd),
    verificationCommand: verificationCommand(profile),
    buildCommand: buildCommand(profile),
    boundaries: boundariesFor(focus.scope, scopedFiles),
    uncertainty,
    nextCommand: "agentkick summarize --task " + quoteShell(focus.task)
  };
}

export async function buildWorkflowSummary(cwd: string, input?: WorkflowSummaryInput) {
  const profile = detectProject(cwd);
  const branch = await gitBranch(cwd);
  const summaryInput = normalizeSummaryInput(input);
  const state = readWorkflowState(cwd);
  const stateScope = state?.activeScope && state.activeScope !== "current task" ? state.activeScope : undefined;
  const selectedScope = summaryInput.scope ?? stateScope ?? summaryInput.task ?? readActiveScope(cwd) ?? "current task";
  const task = summaryInput.task ?? state?.task ?? selectedScope;
  const scopedFiles = findScopedFiles(cwd, selectedScope).slice(0, 12);
  const memory = memoryDigest(cwd);
  const status: SummaryStatus = summaryInput.status ?? (summaryInput.handoff ? "handoff" : "complete");
  const changedFiles = knownChangedFiles(cwd, state, scopedFiles);
  const result =
    status === "handoff"
      ? "Prepared a compact handoff for the next coding-agent session."
      : "Compressed the current workflow state into durable memory.";
  const verificationState = verificationCommand(profile);
  const blocker = status === "blocked" ? "Blocked; add blocker detail before handoff." : "none captured";
  const nextStep =
    status === "handoff" ? `Paste the handoff into a fresh Codex chat and continue ${task}.` : "Run agentkick doctor.";
  const handoffText = handoffTextFor(profile, task, selectedScope, changedFiles, verificationState, blocker, nextStep);
  const appendedTo = appendTaskSummary(cwd, {
    task,
    scope: selectedScope,
    status,
    result,
    changedFiles,
    verificationState,
    blocker,
    nextStep
  });

  return {
    project: profile.name,
    stack: profile.primaryStack ?? profile.template,
    capabilities: profile.capabilities ?? [],
    packageManager: profile.packageManager,
    testCommand: profile.testCommand,
    buildCommand: profile.buildCommand,
    branch,
    task,
    status,
    result,
    scope: selectedScope,
    scopedFiles,
    changedFiles,
    verificationState,
    blocker,
    nextStep,
    appendedTo,
    handoff: summaryInput.handoff,
    handoffText,
    memory,
    freshChatSummary: freshChatSummary(profile, selectedScope, scopedFiles, memory)
  };
}

function updateCurrentTask(
  cwd: string,
  profile: ProjectProfile,
  focus: { scope: string; task: string; feature?: string; files?: string[] },
  files: ScopedFile[],
  uncertainty: string[]
) {
  writeFile(
    cwd,
    "CURRENT_TASK.md",
    `# Current Task

## Status

Prepared focus context.

## Active Scope

- Task: ${focus.task}
- Task scope: ${focus.scope}
${focus.feature ? `- Feature: ${focus.feature}\n` : ""}- Scope source: ${focus.files?.length ? "explicit files" : "task or feature text"}
- Project: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Scoped Files

${files.length > 0 ? files.map((file) => `- ${file.path}: ${file.reason}`).join("\n") : "- No scoped files detected yet."}

## Uncertainty

${uncertainty.map((item) => `- ${item}`).join("\n")}

## Execution Boundary

- Stay inside the scoped files unless a direct dependency requires expansion.
- Update this file if the task scope changes.
- Move durable decisions to \`DECISIONS.md\`.
- Move completed work to \`TASK_HISTORY.md\`.
`
  );
}

function writeWorkflowState(
  cwd: string,
  profile: ProjectProfile,
  focus: { scope: string; task: string; feature?: string },
  files: ScopedFile[]
) {
  const state: WorkflowState = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: focus.scope,
    task: focus.task,
    feature: focus.feature,
    updatedAt: new Date().toISOString(),
    stack: profile.stack,
    scopedFiles: files.map((file) => file.path)
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
}

function normalizeFocusInput(input: FocusInput) {
  if (typeof input === "string") {
    return { scope: input || "current task", task: input || "current task", files: [] as string[] };
  }
  const files = normalizeFileHints(input.files ?? []);
  const fallback = files.length > 0 ? "explicit file scope" : "current task";
  const task = input.task?.trim() || input.scope?.trim() || input.feature?.trim() || fallback;
  const scope = input.feature?.trim() || input.scope?.trim() || task;
  return {
    scope,
    task,
    feature: input.feature?.trim() || undefined,
    files
  };
}

function normalizeSummaryInput(input?: WorkflowSummaryInput) {
  if (!input) return { handoff: false };
  if (typeof input === "string") return { scope: input, task: undefined, handoff: false };
  return {
    scope: input.scope?.trim() || undefined,
    task: input.task?.trim() || undefined,
    handoff: Boolean(input.handoff || input.status === "handoff"),
    status: normalizeSummaryStatus(input.status)
  };
}

function normalizeSummaryStatus(statusValue?: string): SummaryStatus | undefined {
  if (statusValue === "complete" || statusValue === "blocked" || statusValue === "handoff") return statusValue;
  return undefined;
}

function findExplicitScopedFiles(cwd: string, files: string[]): ScopedFile[] {
  const allFiles = scanFiles(cwd);
  const byPath = new Map(allFiles.map((file) => [file.path, file]));
  const selected: ScopedFile[] = [];

  for (const item of files) {
    const normalized = slash(item.replace(/^\.\/+/, ""));
    const fullPath = path.join(cwd, normalized);
    if (directoryExists(fullPath)) {
      selected.push(
        ...allFiles
          .filter((file) => file.path === normalized || file.path.startsWith(`${normalized.replace(/\/$/, "")}/`))
          .slice(0, 24)
          .map((file) => ({ ...file, reason: "inside explicit folder scope" }))
      );
      continue;
    }

    const existingFile = byPath.get(normalized);
    if (existingFile) {
      selected.push({ ...existingFile, reason: "explicit file scope" });
      continue;
    }

    selected.push({ path: normalized, lines: 0, exists: false, reason: "explicit file hint, but not found" });
  }

  return dedupeScopedFiles(selected).slice(0, 24);
}

function findScopedFiles(cwd: string, scope: string): ScopedFile[] {
  const terms = tokenize(scope);
  const allFiles = scanFiles(cwd);
  const scored = allFiles
    .map((file) => scoreFile(cwd, file, terms))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, 16);

  if (scored.length === 0 && scope !== "current task") {
    return allFiles
      .filter((file) => file.path.includes(scope))
      .slice(0, 12)
      .map((file) => ({ ...file, reason: "path contains scope" }));
  }

  return scored.map(({ file, reasons }) => ({ ...file, reason: reasons.slice(0, 2).join(", ") }));
}

function scanFiles(cwd: string) {
  const results: Array<Omit<ScopedFile, "reason">> = [];
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
      if (isAgentMemoryPath(relativePath)) continue;
      if (!SOURCE_EXTENSIONS.has(extension)) continue;
      const stats = fs.statSync(fullPath);
      if (stats.size > 400_000) continue;
      results.push({ path: relativePath, lines: lineCount(readFileSafe(fullPath)), exists: true });
    }
  };
  walk(cwd);
  return results;
}

function scoreFile(cwd: string, file: Omit<ScopedFile, "reason">, terms: string[]) {
  const lowerPath = file.path.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  for (const term of terms) {
    if (lowerPath.includes(term)) {
      score += lowerPath.split("/").some((part) => part.includes(term)) ? 8 : 4;
      reasons.push(`path matches "${term}"`);
    }
  }

  if (score === 0 && terms.length > 0 && file.lines < 900) {
    const content = readFileSafe(path.join(cwd, file.path)).toLowerCase();
    for (const term of terms) {
      if (content.includes(term)) {
        score += 2;
        reasons.push(`content mentions "${term}"`);
        break;
      }
    }
  }

  if (score > 0 && (lowerPath.includes("readme") || lowerPath.endsWith("route.ts") || lowerPath.endsWith("api.ts"))) {
    score += 1;
  }
  if (score > 0 && lowerPath.startsWith("src/")) score += 3;
  if (score > 0 && lowerPath.startsWith("docs/")) score -= 8;
  if (score > 0 && (lowerPath === "readme.md" || lowerPath === "changelog.md" || lowerPath === "claude.md")) score -= 3;
  return { file, score, reasons: reasons.length > 0 ? reasons : ["near scope"] };
}

function memoryDigest(cwd: string) {
  return MEMORY_FILES.filter((file) => fs.existsSync(path.join(cwd, file))).map((file) => {
    const content = readFileSafe(path.join(cwd, file));
    return `${file}: ${compressText(content, 180)}`;
  });
}

function boundariesFor(scope: string, files: ScopedFile[]) {
  const roots = [...new Set(files.map((file) => file.path.split("/").slice(0, 3).join("/")))].slice(0, 5);
  return [
    `Primary task scope is "${scope}".`,
    roots.length > 0 ? `Prefer these boundaries: ${roots.join(", ")}.` : "No source boundary was detected yet.",
    "Never paste full source files into the agent chat.",
    "Do not edit generated, build, dependency, or unrelated files.",
    "Run the documented test/build command after changes when possible."
  ];
}

function freshChatSummary(profile: ProjectProfile, scope: string, files: ScopedFile[], memory: string[]) {
  return [
    `${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared with AgentKick.`,
    `Current scope: ${scope}.`,
    files.length > 0
      ? `Relevant files: ${files.map((file) => file.path).join(", ")}.`
      : "Relevant files are not identified yet.",
    `Verification: ${profile.testCommand}; build: ${profile.buildCommand}.`,
    `Memory: ${memory
      .map((item) => item.replace(/\s+/g, " "))
      .slice(0, 4)
      .join(" ")}`
  ].join("\n");
}

function handoffTextFor(
  profile: ProjectProfile,
  task: string,
  scope: string,
  changedFiles: string[],
  verificationState: string,
  blocker: string,
  nextStep: string
) {
  return [
    `Task: ${task}`,
    `Repo: ${profile.name} (${profile.stack.join(", ") || "generic"})`,
    `Scope: ${scope}`,
    `Status: handoff`,
    `Changed files: ${changedFiles.length > 0 ? changedFiles.join(", ") : "not known"}`,
    `Verification: ${verificationState}`,
    `Blocker: ${blocker}`,
    `Next: ${nextStep}`
  ].join("\n");
}

function appendTaskSummary(
  cwd: string,
  entry: {
    task: string;
    scope: string;
    status: SummaryStatus;
    result: string;
    changedFiles: string[];
    verificationState: string;
    blocker: string;
    nextStep: string;
  }
) {
  const file = "TASK_HISTORY.md";
  const existingContent = readFileSafe(path.join(cwd, file)) || "# Task History\n\n## Entries\n";
  const date = new Date().toISOString();
  const block = [
    "",
    `### ${date} - ${entry.task}`,
    "",
    `- Status: ${entry.status}`,
    `- Result: ${entry.result}`,
    `- Scope: ${entry.scope}`,
    `- Changed files: ${entry.changedFiles.length > 0 ? entry.changedFiles.join(", ") : "not known"}`,
    `- Verification: ${entry.verificationState}`,
    `- Blocker: ${entry.blocker}`,
    `- Next step: ${entry.nextStep}`,
    ""
  ].join("\n");
  writeFile(cwd, file, `${existingContent.trimEnd()}\n${block}`);
  return file;
}

function knownChangedFiles(cwd: string, state: WorkflowState | null, scopedFiles: ScopedFile[]) {
  const fromState = state?.scopedFiles ?? [];
  if (fromState.length > 0) return fromState.slice(0, 20);
  const fromScope = scopedFiles.map((file) => file.path).slice(0, 20);
  if (fromScope.length > 0) return fromScope;

  try {
    const output = execSync("git diff --name-only", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output
      .split(/\r?\n/)
      .map((file) => slash(file.trim()))
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function uncertaintyFor(
  focus: { scope: string; task: string; files?: string[] },
  files: ScopedFile[],
  explicitFiles: string[]
) {
  const warnings: string[] = [];
  if (explicitFiles.length > 0) warnings.push("Explicit --files scope is being used as the source of truth.");
  if (files.length === 0) warnings.push("No task files were found; start by confirming entry points before editing.");
  if (files.length > 12) warnings.push("Scope is broad; split the task or pass fewer explicit files.");
  if (files.some((file) => !file.exists)) warnings.push("Some explicit file hints were not found on disk.");
  if (focus.task.trim().split(/\s+/).length < 3) warnings.push("Task text is short; file selection is best-effort.");
  return warnings.length > 0 ? warnings : ["No major uncertainty detected from the provided scope."];
}

function avoidPathsFor(cwd: string) {
  const preferred = [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    ".next/",
    ".turbo/",
    ".agentkick/",
    "vendor/",
    "target/"
  ];
  const existingPaths = preferred.filter((item) => {
    const normalized = item.replace(/\/$/, "");
    return (
      directoryExists(path.join(cwd, normalized)) || ["node_modules/", "dist/", "build/", ".agentkick/"].includes(item)
    );
  });
  return [...new Set(existingPaths)];
}

function verificationCommand(profile: ProjectProfile) {
  if (profile.testCommand && !profile.testCommand.startsWith("document ")) return profile.testCommand;
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "document the narrowest useful verification command before editing";
}

function buildCommand(profile: ProjectProfile) {
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "not detected";
}

function readWorkflowState(cwd: string) {
  return readJsonSafe<WorkflowState>(path.join(cwd, ".agentkick", "workflow-state.json"));
}

function readActiveScope(cwd: string) {
  const state = readWorkflowState(cwd);
  if (state?.activeScope && state.activeScope !== "none") return state.activeScope;
  const currentTask = readFileSafe(path.join(cwd, "CURRENT_TASK.md"));
  const match = currentTask.match(/Task scope:\s*(.+)/i);
  return match?.[1]?.trim() || null;
}

function existing(cwd: string, files: string[]) {
  return files.filter((file) => fs.existsSync(path.join(cwd, file)));
}

function tokenize(value: string) {
  const terms = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 2 && !["the", "and", "for", "with", "task", "current"].includes(part));
  const aliases: Record<string, string[]> = {
    cli: ["command", "commands", "commander", "program"],
    auth: ["login", "session", "user", "account"],
    api: ["route", "routes", "server", "service"],
    workflow: ["workflows", "state", "task"],
    workflows: ["workflow", "state", "task"]
  };
  return [...new Set(terms.flatMap((term) => [term, ...(aliases[term] ?? [])]))];
}

function normalizeFileHints(files: string[]) {
  return [
    ...new Set(
      files
        .map((file) => slash(file.trim()))
        .filter(Boolean)
        .map((file) => file.replace(/^\.\/+/, ""))
    )
  ];
}

function dedupeScopedFiles(files: ScopedFile[]) {
  const seen = new Set<string>();
  return files.filter((file) => {
    if (seen.has(file.path)) return false;
    seen.add(file.path);
    return true;
  });
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

function compressText(content: string, maxLength: number) {
  const compact = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 3)}...`;
}

function isAgentMemoryPath(relativePath: string) {
  return (
    MEMORY_FILES.includes(relativePath) ||
    relativePath === ".agentkick.json" ||
    relativePath.startsWith(".github/") ||
    relativePath.startsWith(".claude/") ||
    relativePath.startsWith(".codex/") ||
    relativePath.startsWith(".agents/") ||
    relativePath.startsWith(".cursor/")
  );
}

function directoryExists(directory: string) {
  try {
    return fs.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

function quoteShell(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function slash(value: string) {
  return value.replace(/\\/g, "/");
}
