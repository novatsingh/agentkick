import path from "node:path";
import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import type { ProjectProfile } from "../core/types.js";
import { detectProject } from "../detectors/project-detector.js";
import { bullet, command, header, keyValue, muted, pathLabel, section } from "../utils/ui.js";

type SplitTaskOptions = {
  files?: string[];
  json?: boolean;
};

type TaskChunk = {
  id: string;
  title: string;
  scope: string;
  nonGoals: string[];
  dependencies: string[];
  suggestedFiles: string[];
  verification: string;
  agentPrompt: string;
  doFirst: boolean;
  parallelizable: boolean;
};

type SplitTaskResult = {
  schemaVersion: 1;
  command: "split-task";
  task: string;
  profile: {
    name: string;
    stack: string;
    capabilities: string[];
    packageManager: string;
  };
  files: string[];
  subtasks: TaskChunk[];
  nextCommand: string;
  warnings: string[];
  boundaries: string[];
};

type TaskArea = {
  id: string;
  title: string;
  scope: string;
  keywords: string[];
  nonGoals: string[];
};

const TASK_AREAS: TaskArea[] = [
  {
    id: "auth",
    title: "Define auth and session behavior",
    scope: "authentication, sessions, users, permissions",
    keywords: ["auth", "login", "logout", "session", "user", "account", "permission", "role"],
    nonGoals: ["Do not change billing, dashboard, or unrelated account settings."]
  },
  {
    id: "billing",
    title: "Implement billing or checkout flow",
    scope: "billing, checkout, plans, payments, subscriptions",
    keywords: ["billing", "checkout", "payment", "paid", "plan", "pricing", "subscription", "stripe", "invoice"],
    nonGoals: ["Do not change auth, dashboard UI, or database schema unless the task requires it."]
  },
  {
    id: "dashboard",
    title: "Update dashboard experience",
    scope: "dashboard, reports, settings, account workspace",
    keywords: ["dashboard", "admin", "report", "analytics", "workspace", "settings", "table", "chart"],
    nonGoals: ["Do not change backend contracts unless the UI path proves it is required."]
  },
  {
    id: "api",
    title: "Define API and service contract",
    scope: "API routes, server services, request validation",
    keywords: ["api", "route", "endpoint", "server", "backend", "service", "webhook", "database", "prisma", "supabase"],
    nonGoals: ["Do not redesign UI or run migrations without calling out compatibility impact."]
  },
  {
    id: "ui",
    title: "Implement user-facing UI changes",
    scope: "screens, components, styles, forms, interaction states",
    keywords: ["ui", "screen", "page", "component", "button", "form", "popup", "layout", "style", "modal"],
    nonGoals: ["Do not change persistence, auth, or background jobs from a UI-only task."]
  },
  {
    id: "extension",
    title: "Check extension surfaces",
    scope: "manifest, popup, background worker, content script",
    keywords: ["extension", "manifest", "popup", "background", "content", "worker", "chrome"],
    nonGoals: ["Do not add broad browser permissions or page access without a clear user need."]
  },
  {
    id: "desktop",
    title: "Check desktop runtime boundaries",
    scope: "desktop shell, native bridge, IPC, preload, renderer",
    keywords: ["desktop", "electron", "tauri", "ipc", "preload", "renderer", "native"],
    nonGoals: ["Do not expose broad filesystem, shell, or native bridge permissions."]
  }
];

export function registerSplitTaskCommand(program: Command, context: CommandContext) {
  program
    .command("split-task")
    .description("Split a broad coding request into scoped execution chunks.")
    .argument("<task>", "broad task or feature request")
    .option("--files <paths...>", "optional file or folder hints")
    .option("--json", "print stable JSON output")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick split-task "Add paid checkout and dashboard" --files src/app.ts src/billing.ts
  $ agentkick split-task "Improve extension popup" --json
`
    )
    .action((task: string, options: SplitTaskOptions) => {
      const profile = detectProject(context.cwd);
      const result = splitTask(context.cwd, profile, task, options.files ?? []);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(renderSplitTask(result));
    });
}

function splitTask(cwd: string, profile: ProjectProfile, task: string, fileHints: string[]): SplitTaskResult {
  const normalizedFiles = normalizeFiles(fileHints);
  const areas = selectTaskAreas(task, normalizedFiles, profile);
  const warnings = warningsFor(task, normalizedFiles, areas);
  const chunks = buildChunks(profile, task, areas, normalizedFiles);

  return {
    schemaVersion: 1,
    command: "split-task",
    task,
    profile: {
      name: profile.name,
      stack: profile.primaryStack ?? profile.template,
      capabilities: profile.capabilities ?? [],
      packageManager: profile.packageManager
    },
    files: normalizedFiles,
    subtasks: chunks,
    nextCommand: nextCommandFor(chunks),
    warnings,
    boundaries: [
      "No autonomous scheduling.",
      "No agent assignment.",
      "No semantic code ownership claims.",
      "No background jobs.",
      "No file writes by default.",
      `Repository: ${path.basename(cwd)}`
    ]
  };
}

function selectTaskAreas(task: string, files: string[], profile: ProjectProfile) {
  const haystack = `${task} ${files.join(" ")} ${(profile.stack ?? []).join(" ")}`.toLowerCase();
  const matched = TASK_AREAS.filter((area) => area.keywords.some((keyword) => haystack.includes(keyword)));
  if (matched.length > 0) return matched.slice(0, 4);

  return [
    {
      id: "investigate",
      title: "Map the smallest relevant code path",
      scope: "task discovery and code-path confirmation",
      keywords: [],
      nonGoals: ["Do not edit broad unrelated areas during investigation."]
    }
  ];
}

function buildChunks(profile: ProjectProfile, task: string, areas: TaskArea[], files: string[]): TaskChunk[] {
  const chunks: TaskChunk[] = [];
  const needsInvestigation = files.length === 0 || areas.some((area) => area.id === "investigate");

  if (needsInvestigation) {
    chunks.push({
      id: "confirm-scope",
      title: "Confirm task scope",
      scope: "repo inspection, relevant entry points, verification command",
      nonGoals: ["Do not edit source files in this step.", "Do not infer ownership from names alone."],
      dependencies: [],
      suggestedFiles: files,
      verification: "No code verification yet; produce the files to inspect and the next focused command.",
      agentPrompt: promptFor("Confirm the narrow file scope before making changes.", task, files),
      doFirst: true,
      parallelizable: false
    });
  }

  for (const area of areas) {
    if (area.id === "investigate") continue;
    const suggestedFiles = filesForArea(area, files);
    chunks.push({
      id: area.id,
      title: area.title,
      scope: area.scope,
      nonGoals: area.nonGoals,
      dependencies: needsInvestigation ? ["confirm-scope"] : [],
      suggestedFiles,
      verification: verificationFor(profile, area),
      agentPrompt: promptFor(`Work only on ${area.scope}.`, task, suggestedFiles),
      doFirst: chunks.length === 0,
      parallelizable: chunks.length > 1 || (chunks.length === 1 && !needsInvestigation)
    });
  }

  chunks.push({
    id: "verify-and-handoff",
    title: "Verify and prepare handoff",
    scope: "tests, build, agent summary, follow-up risks",
    nonGoals: ["Do not add new behavior while verifying.", "Do not hide failing checks."],
    dependencies: chunks.map((chunk) => chunk.id),
    suggestedFiles: [],
    verification: verificationCommand(profile),
    agentPrompt: promptFor("Run verification, summarize changed files, blockers, and follow-up.", task, files),
    doFirst: false,
    parallelizable: false
  });

  return chunks.slice(0, 5).map((chunk, index, all) => ({
    ...chunk,
    doFirst: index === 0,
    parallelizable: chunk.parallelizable && index > 0 && index < all.length - 1
  }));
}

function filesForArea(area: TaskArea, files: string[]) {
  const matches = files.filter((file) => {
    const lower = file.toLowerCase();
    return area.keywords.some((keyword) => lower.includes(keyword));
  });
  return matches.length > 0 ? matches : files.slice(0, 4);
}

function verificationFor(profile: ProjectProfile, area: TaskArea) {
  if (area.id === "extension" && profile.stack.includes("chrome-extension")) return profile.buildCommand;
  if (area.id === "desktop" && (profile.stack.includes("electron") || profile.stack.includes("tauri")))
    return profile.buildCommand;
  return verificationCommand(profile);
}

function verificationCommand(profile: ProjectProfile) {
  if (profile.testCommand && !profile.testCommand.startsWith("document ")) return profile.testCommand;
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "document the narrowest useful verification command before editing";
}

function promptFor(instruction: string, task: string, files: string[]) {
  const fileLine = files.length > 0 ? ` Suggested files: ${files.join(", ")}.` : " File scope is incomplete.";
  return `${instruction} Task: ${task}.${fileLine} Preserve unrelated changes and report verification.`;
}

function warningsFor(task: string, files: string[], areas: TaskArea[]) {
  const warnings: string[] = [];
  if (files.length === 0) warnings.push("File scope is incomplete; start by confirming relevant entry points.");
  if (areas.length >= 4) warnings.push("Task appears broad; keep each chunk independent and avoid mixed refactors.");
  if (task.trim().split(/\s+/).length < 3) warnings.push("Task text is short; subtask scopes are best-effort.");
  return warnings;
}

function nextCommandFor(chunks: TaskChunk[]) {
  const first = chunks.find((chunk) => chunk.doFirst) ?? chunks[0];
  if (!first) return "agentkick focus <scope>";
  return `agentkick focus ${quoteScope(first.id === "confirm-scope" ? "current task" : first.id)}`;
}

function quoteScope(scope: string) {
  return /\s/.test(scope) ? `"${scope}"` : scope;
}

function normalizeFiles(files: string[]) {
  return [
    ...new Set(
      files
        .map((file) => file.trim())
        .filter(Boolean)
        .map((file) => file.replace(/\\/g, "/"))
    )
  ];
}

function renderSplitTask(result: SplitTaskResult) {
  const lines = [
    header("AgentKick split-task", "Rule-based execution chunks for one broad request."),
    "",
    keyValue("Task", result.task),
    keyValue("Detected stack", result.profile.stack),
    result.profile.capabilities.length ? keyValue("Capabilities", result.profile.capabilities.join(", ")) : "",
    result.files.length ? keyValue("File hints", result.files.map((file) => pathLabel(file)).join(", ")) : "",
    "",
    section("Suggested execution:"),
    ...result.subtasks.flatMap((chunk, index) => renderChunk(chunk, index)),
    result.warnings.length ? "" : "",
    result.warnings.length ? section("Warnings:") : "",
    ...result.warnings.map((warning) => bullet(warning)),
    "",
    section("Boundaries:"),
    ...result.boundaries.slice(0, 5).map((boundary) => bullet(boundary)),
    "",
    keyValue("Next", command(result.nextCommand))
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function renderChunk(chunk: TaskChunk, index: number) {
  return [
    `${index + 1}. ${chunk.doFirst ? "[do first] " : ""}${chunk.title}${
      chunk.parallelizable ? ` ${muted("(parallelizable)")}` : ""
    }`,
    `   ${keyValue("Scope", chunk.scope)}`,
    `   ${keyValue("Non-goals", chunk.nonGoals.join(" "))}`,
    `   ${keyValue("Dependencies", chunk.dependencies.length ? chunk.dependencies.join(", ") : "none")}`,
    `   ${keyValue(
      "Suggested files",
      chunk.suggestedFiles.length ? chunk.suggestedFiles.map((file) => pathLabel(file)).join(", ") : "unknown"
    )}`,
    `   ${keyValue("Verification", chunk.verification)}`,
    `   ${keyValue("Agent prompt", chunk.agentPrompt)}`
  ];
}
