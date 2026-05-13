import fs from "node:fs";
import path from "node:path";
import { detectProject } from "../detectors/project-detector.js";
import type { ProjectProfile } from "../core/types.js";
import { json, readJsonSafe, writeFile } from "../utils/fs.js";
import { gitBranch } from "../utils/git.js";
import { bullet, command, header, keyValue, pathLabel, section } from "../utils/ui.js";

type ScopedFile = {
  path: string;
  reason: string;
  lines: number;
};

type WorkflowState = {
  schemaVersion: 1;
  project: string;
  activeScope: string;
  updatedAt: string;
  stack: string[];
  scopedFiles: string[];
};

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

export function writeWorkflowMemoryFiles(cwd: string, profile: ProjectProfile) {
  writeFile(
    cwd,
    "CURRENT_TASK.md",
    `# Current Task

## Status

No active task.

## Active Scope

- Project: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Scoped Files

- None yet.

## Update Rule

Keep this file focused on the active task, touched files, blockers, and verification status.
`
  );
  writeFile(
    cwd,
    "ARCHITECTURE.md",
    `# Architecture

## Project Shape

${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared for AI-assisted development.

## Agent Boundaries

- Read \`AGENTS.md\` before broad edits.
- Keep task changes scoped to the smallest relevant module.
- Move durable decisions into \`DECISIONS.md\`.
- Move completed task notes into \`TASK_HISTORY.md\`.
`
  );
  writeFile(
    cwd,
    "FEATURE_SUMMARIES.md",
    `# Feature Summaries

Keep compact notes for each important feature.

## Format

- Feature:
- Owns:
- Key files:
- Current risks:
`
  );
  writeFile(
    cwd,
    "WORKFLOW_RULES.md",
    `# Workflow Rules

## Agent Startup

1. Read \`AGENTS.md\`.
2. Read \`CURRENT_TASK.md\`.
3. Read \`ARCHITECTURE.md\`.
4. Open only files needed for the scoped task.

## Updates

- Update \`CURRENT_TASK.md\` when scope changes.
- Add durable decisions to \`DECISIONS.md\`.
- Add completed work to \`TASK_HISTORY.md\`.
`
  );
  writeFile(
    cwd,
    "DECISIONS.md",
    `# Decisions

Record durable technical and product decisions here. Keep entries short enough for agents to scan.

## Format

- Date:
- Decision:
- Context:
- Consequences:
`
  );
  writeFile(
    cwd,
    "TASK_HISTORY.md",
    `# Task History

Record completed, verified work here.

## Entries

- No completed tasks yet.
`
  );
}

export function writeInitialWorkflowState(cwd: string, profile: ProjectProfile) {
  const state: WorkflowState = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: "none",
    updatedAt: new Date().toISOString(),
    stack: profile.stack,
    scopedFiles: []
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
}

export function buildFocusContext(cwd: string, scope = "current task") {
  const profile = detectProject(cwd);
  const scopedFiles = findScopedFiles(cwd, scope);
  updateCurrentTask(cwd, profile, scope, scopedFiles);
  writeWorkflowState(cwd, profile, scope, scopedFiles);

  return {
    profile,
    scope,
    loadFirst: existing(cwd, ALWAYS_LOAD),
    scopedFiles,
    memory: memoryDigest(cwd),
    boundaries: boundariesFor(scope, scopedFiles)
  };
}

export async function buildWorkflowSummary(cwd: string, scope?: string) {
  const profile = detectProject(cwd);
  const branch = await gitBranch(cwd);
  const selectedScope = scope ?? readActiveScope(cwd) ?? "current task";
  const scopedFiles = findScopedFiles(cwd, selectedScope).slice(0, 12);
  const memory = memoryDigest(cwd);

  return {
    project: profile.name,
    stack: profile.primaryStack ?? profile.template,
    capabilities: profile.capabilities ?? [],
    packageManager: profile.packageManager,
    testCommand: profile.testCommand,
    buildCommand: profile.buildCommand,
    branch,
    scope: selectedScope,
    scopedFiles,
    memory,
    freshChatSummary: freshChatSummary(profile, selectedScope, scopedFiles, memory)
  };
}

export function renderFocus(context: ReturnType<typeof buildFocusContext>) {
  const lines = [
    header("AgentKick focus", "Scoped context for one task."),
    "",
    keyValue("Scope", context.scope),
    keyValue("Detected stack", context.profile.primaryStack ?? context.profile.template),
    context.profile.capabilities?.length
      ? keyValue("Detected capabilities", context.profile.capabilities.join(", "))
      : "",
    "",
    section("Load first:"),
    ...context.loadFirst.map((file) => bullet(pathLabel(file))),
    "",
    section("Scoped files:"),
    ...(context.scopedFiles.length > 0
      ? context.scopedFiles.map((file) => bullet(`${pathLabel(file.path)} (${file.reason})`))
      : [bullet("No scoped source files found. Start from the memory files above.")]),
    "",
    section("Execution boundaries:"),
    ...context.boundaries.map((boundary) => bullet(boundary)),
    "",
    section("Compressed memory:"),
    ...context.memory.map((item) => bullet(item)),
    "",
    command("Working rule: load only the files above unless the code path proves another file is required.")
  ];
  return lines.filter((line) => line !== "").join("\n");
}

export function renderSummary(summary: Awaited<ReturnType<typeof buildWorkflowSummary>>) {
  const lines = [
    header("AgentKick summary", "Fresh-chat handoff for the current workflow state."),
    "",
    keyValue("Project", summary.project),
    summary.branch ? keyValue("Git branch", summary.branch) : "",
    keyValue("Scope", summary.scope),
    keyValue("Stack", summary.stack),
    summary.capabilities.length ? keyValue("Capabilities", summary.capabilities.join(", ")) : "",
    keyValue("Package manager", summary.packageManager),
    keyValue("Test", summary.testCommand),
    keyValue("Build", summary.buildCommand),
    "",
    section("Scoped files:"),
    ...(summary.scopedFiles.length > 0
      ? summary.scopedFiles.map((file) => bullet(`${pathLabel(file.path)} (${file.lines} lines)`))
      : [bullet("None detected from current scope.")]),
    "",
    section("Memory digest:"),
    ...summary.memory.map((item) => bullet(item)),
    "",
    section("Fresh-chat summary:"),
    summary.freshChatSummary
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function updateCurrentTask(cwd: string, profile: ProjectProfile, scope: string, files: ScopedFile[]) {
  writeFile(
    cwd,
    "CURRENT_TASK.md",
    `# Current Task

## Status

Prepared focus context.

## Active Scope

- Task scope: ${scope}
- Project: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Scoped Files

${files.length > 0 ? files.map((file) => `- ${file.path}: ${file.reason}`).join("\n") : "- No scoped files detected yet."}

## Execution Boundary

- Stay inside the scoped files unless a direct dependency requires expansion.
- Update this file if the task scope changes.
- Move durable decisions to \`DECISIONS.md\`.
- Move completed work to \`TASK_HISTORY.md\`.
`
  );
}

function writeWorkflowState(cwd: string, profile: ProjectProfile, scope: string, files: ScopedFile[]) {
  const state: WorkflowState = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: scope,
    updatedAt: new Date().toISOString(),
    stack: profile.stack,
    scopedFiles: files.map((file) => file.path)
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
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
      results.push({ path: relativePath, lines: lineCount(readFileSafe(fullPath)) });
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

function readActiveScope(cwd: string) {
  const state = readJsonSafe<WorkflowState>(path.join(cwd, ".agentkick", "workflow-state.json"));
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

function slash(value: string) {
  return value.replace(/\\/g, "/");
}
