#!/usr/bin/env node

// src/core/program.ts
import process2 from "process";
import { Command } from "commander";

// src/core/constants.ts
var VERSION = "0.1.0";
var SUPPORTED_TEMPLATES = [
  "chrome-extension",
  "ai-saas",
  "saas",
  "marketplace",
  "internal-tool",
  "electron-app",
  "tauri-app"
];
var SUPPORTED_PACKS = [
  "core",
  "chrome-extension",
  "nextjs",
  "netlify",
  "security",
  "github",
  "python",
  "php",
  "go",
  "rust",
  "electron",
  "tauri"
];

// src/detectors/project-detector.ts
import fs2 from "fs";
import path2 from "path";

// src/utils/fs.ts
import path from "path";
import fs from "fs-extra";
var writeMode = { dryRun: false };
function setWriteMode(mode) {
  writeMode = { ...writeMode, ...mode };
}
function ensureDir(dir) {
  if (writeMode.dryRun) return;
  fs.ensureDirSync(dir);
}
function writeFile(cwd, relativePath, content) {
  writeAbsoluteFile(path.join(cwd, relativePath), content);
}
function writeAbsoluteFile(file2, content) {
  if (writeMode.dryRun) {
    const action = fs.existsSync(file2) ? "update" : "create";
    console.log(`DRY-RUN would ${action}: ${file2}`);
    return;
  }
  ensureDir(path.dirname(file2));
  if (fs.existsSync(file2)) {
    const existing2 = fs.readFileSync(file2, "utf8");
    if (existing2 === content) return;
    const backup = `${file2}.agentkick-backup`;
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, existing2, "utf8");
  }
  fs.writeFileSync(file2, content, "utf8");
}
function readJsonSafe(file2) {
  try {
    return JSON.parse(fs.readFileSync(file2, "utf8"));
  } catch {
    return null;
  }
}
function listTopLevelFiles(cwd) {
  try {
    return new Set(fs.readdirSync(cwd));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function existsAny(cwd, candidates) {
  return candidates.some((candidate) => fs.existsSync(path.join(cwd, candidate)));
}
function hasText(file2, text) {
  try {
    return fs.readFileSync(file2, "utf8").includes(text);
  } catch {
    return false;
  }
}
function json(value) {
  return `${JSON.stringify(value, null, 2)}
`;
}

// src/detectors/project-detector.ts
function buildProfile(template, projectName) {
  const stackByTemplate = {
    "chrome-extension": ["chrome-extension", "javascript", "browser"],
    "ai-saas": ["nextjs", "react", "typescript", "ai-saas", "api-routes"],
    saas: ["nextjs", "react", "typescript", "saas", "api-routes"],
    marketplace: ["nextjs", "react", "typescript", "marketplace", "api-routes"],
    "internal-tool": ["vite", "react", "typescript", "internal-tool"],
    "electron-app": ["electron", "vite", "react", "typescript", "desktop-app"],
    "tauri-app": ["tauri", "vite", "react", "typescript", "desktop-app", "rust"]
  };
  const testCommandByTemplate = {
    "chrome-extension": "npm run check",
    "tauri-app": "npm run typecheck"
  };
  const buildCommandByTemplate = {
    "chrome-extension": "npm run package",
    "electron-app": "npm run build",
    "tauri-app": "npm run build"
  };
  return {
    name: projectName,
    template,
    stack: stackByTemplate[template] ?? ["generic"],
    packageManager: "npm",
    testCommand: testCommandByTemplate[template] ?? "npm test",
    buildCommand: buildCommandByTemplate[template] ?? "npm run build",
    launchTarget: launchTargetFor(template)
  };
}
function detectProject(cwd) {
  const packageJson = readJsonSafe(path2.join(cwd, "package.json"));
  const name = packageJson?.name ?? path2.basename(cwd);
  const detection = analyzeProject(cwd, packageJson);
  const primaryStack = detection.primaryStack;
  const capabilities = detection.capabilities;
  const stack = primaryStack === "generic" ? [] : [primaryStack, ...capabilities];
  return {
    name,
    template: primaryStack,
    primaryStack,
    capabilities,
    stack,
    detection,
    packageManager: detectPackageManager(cwd, stack),
    testCommand: detectTestCommand(cwd, packageJson, stack),
    buildCommand: detectBuildCommand(cwd, packageJson, stack),
    launchTarget: stack.includes("netlify") ? "Netlify" : "GitHub"
  };
}
function defaultPacksForTemplate(template) {
  return {
    "chrome-extension": ["chrome-extension"],
    "ai-saas": ["nextjs", "security", "github"],
    saas: ["nextjs", "github"],
    marketplace: ["nextjs", "security", "github"],
    "internal-tool": ["github"],
    "electron-app": ["electron", "github"],
    "tauri-app": ["tauri", "github"]
  }[template] ?? [];
}
function packageManagerCommand(cwd) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-workspace.yaml")) return "pnpm";
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  return "npm";
}
function hasDependency(packageJson, dependency) {
  return packageDependencies(packageJson).has(dependency);
}
function hasAnyDependency(packageJson, dependencies) {
  const available = packageDependencies(packageJson);
  return dependencies.some((dependency) => available.has(dependency));
}
function packageDependencies(packageJson) {
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const entries = sections.flatMap((section2) => Object.keys(packageJson?.[section2] ?? {}));
  return new Set(entries);
}
function analyzeProject(cwd, packageJson) {
  const files = listTopLevelFiles(cwd);
  const checked = /* @__PURE__ */ new Set([
    "package.json",
    "manifest.json",
    "public/manifest.json",
    "src/manifest.json",
    "next.config.*",
    "vite.config.*",
    "tailwind.config.*",
    "prisma/schema.prisma",
    "supabase",
    "app/api",
    "pages/api",
    "src-tauri",
    "tauri.conf.json",
    "docker-compose.yml",
    "docker-compose.yaml",
    "Dockerfile",
    "turbo.json",
    "pnpm-workspace.yaml"
  ]);
  const configFiles = /* @__PURE__ */ new Set();
  const reasoning = [];
  const detected = /* @__PURE__ */ new Set();
  const primaryCandidates = /* @__PURE__ */ new Set();
  const capabilities = /* @__PURE__ */ new Set();
  const checkPath = (relativePath) => {
    checked.add(relativePath);
    return fs2.existsSync(path2.join(cwd, relativePath));
  };
  const addConfig = (relativePath) => {
    configFiles.add(relativePath);
    checked.add(relativePath);
  };
  const addPrimary = (label, reason) => {
    detected.add(label);
    primaryCandidates.add(label);
    reasoning.push(`${label}: ${reason}`);
  };
  const addCapability = (label, reason) => {
    detected.add(label);
    capabilities.add(label);
    reasoning.push(`${label}: ${reason}`);
  };
  const topLevelMatches = (pattern) => {
    const matches = [...files].filter((file2) => pattern.test(file2)).sort();
    for (const match of matches) addConfig(match);
    return matches;
  };
  if (topLevelMatches(/^turbo\.json$/).length > 0) addPrimary("monorepo-turborepo", "turbo.json exists");
  if (topLevelMatches(/^pnpm-workspace\.yaml$/).length > 0) addPrimary("monorepo-pnpm", "pnpm-workspace.yaml exists");
  const manifestFiles = ["manifest.json", "public/manifest.json", "src/manifest.json"].filter(
    (file2) => checkPath(file2)
  );
  const chromeManifest = manifestFiles.find((file2) => readJsonSafe(path2.join(cwd, file2))?.manifest_version);
  if (chromeManifest) {
    addConfig(chromeManifest);
    addPrimary("chrome-extension", `${chromeManifest} contains manifest_version`);
  }
  const nextConfigs = topLevelMatches(/^next\.config\.(js|mjs|cjs|ts)$/);
  if (nextConfigs.length > 0 || hasDependency(packageJson, "next")) {
    addPrimary("nextjs", nextConfigs.length > 0 ? `${nextConfigs[0]} exists` : "package.json depends on next");
  }
  const viteConfigs = topLevelMatches(/^vite\.config\.(js|mjs|cjs|ts|mts|cts)$/);
  if (viteConfigs.length > 0 || hasDependency(packageJson, "vite")) {
    addPrimary("vite", viteConfigs.length > 0 ? `${viteConfigs[0]} exists` : "package.json depends on vite");
  }
  if (packageJson || files.has("package-lock.json") || files.has("pnpm-lock.yaml") || files.has("yarn.lock")) {
    addCapability("nodejs", "Node package metadata or lockfile exists");
    primaryCandidates.add("nodejs");
  }
  if (hasDependency(packageJson, "react")) {
    addCapability("react", "package.json depends on react");
    primaryCandidates.add("react");
  }
  if (hasAnyDependency(packageJson, ["express", "fastify", "hono"])) {
    addPrimary("node-api", "package.json depends on express, fastify, or hono");
  }
  if (checkPath("prisma/schema.prisma")) addCapability("prisma", "prisma/schema.prisma exists");
  if (directoryExists(cwd, "supabase", checked)) addCapability("supabase", "supabase folder exists");
  if (directoryExists(cwd, "app/api", checked) || directoryExists(cwd, "pages/api", checked)) {
    addCapability("api-routes", "app/api or pages/api exists");
  }
  const tailwindConfigs = topLevelMatches(/^tailwind\.config\.(js|mjs|cjs|ts)$/);
  if (tailwindConfigs.length > 0) addCapability("tailwind", `${tailwindConfigs[0]} exists`);
  if (topLevelMatches(/^docker-compose\.ya?ml$/).length > 0 || checkPath("Dockerfile")) {
    addCapability("docker", "docker-compose.yml or Dockerfile exists");
  }
  if (files.has("netlify.toml")) {
    addConfig("netlify.toml");
    addCapability("netlify", "netlify.toml exists");
  }
  if (files.has("pyproject.toml") || files.has("requirements.txt")) addPrimary("python", "Python project files exist");
  if (existsAny(cwd, ["app/main.py"]) && hasText(path2.join(cwd, "app/main.py"), "FastAPI"))
    addPrimary("fastapi", "app/main.py imports FastAPI");
  if (existsAny(cwd, ["app.py", "app/__init__.py"]) && hasText(path2.join(cwd, "app.py"), "Flask"))
    addPrimary("flask", "Flask app entrypoint detected");
  if (files.has("composer.json")) addPrimary("php", "composer.json exists");
  if (files.has("artisan")) addPrimary("laravel", "artisan exists");
  if (files.has("go.mod")) addPrimary("go", "go.mod exists");
  if (files.has("Cargo.toml")) addPrimary("rust", "Cargo.toml exists");
  if (hasDependency(packageJson, "electron")) addPrimary("electron", "package.json depends on electron");
  if (hasDependency(packageJson, "@tauri-apps/api") || directoryExists(cwd, "src-tauri", checked)) {
    addPrimary("tauri", "Tauri dependency or src-tauri folder exists");
  }
  if (packageJson?.bin) addPrimary("node-cli", "package.json defines bin");
  const primaryStack = pickPrimaryStack(primaryCandidates);
  const orderedCapabilities = orderLabels(
    [.../* @__PURE__ */ new Set([...capabilities, ...primaryCandidates])].filter((label) => label !== primaryStack)
  );
  const workspaceHints = primaryStack === "generic" ? findWorkspaceHints(cwd) : [];
  if (primaryStack === "generic") {
    reasoning.push("generic: no supported stack markers were found");
    if (workspaceHints.length > 0) {
      reasoning.push(
        `workspace: found project markers in child folders: ${workspaceHints.map((hint2) => hint2.path).join(", ")}`
      );
    }
  }
  return {
    cwd,
    primaryStack,
    capabilities: orderedCapabilities,
    detected: primaryStack === "generic" ? [] : [primaryStack, ...orderedCapabilities],
    workspaceHints,
    filesChecked: [...checked].sort(),
    dependencies: [...packageDependencies(packageJson)].sort(),
    configFiles: [...configFiles].sort(),
    reasoning
  };
}
function pickPrimaryStack(candidates) {
  const priority = [
    "monorepo-turborepo",
    "monorepo-pnpm",
    "chrome-extension",
    "nextjs",
    "electron",
    "tauri",
    "vite",
    "node-api",
    "fastapi",
    "flask",
    "laravel",
    "go",
    "rust",
    "python",
    "php",
    "react",
    "nodejs",
    "node-cli"
  ];
  return priority.find((label) => candidates.has(label)) ?? "generic";
}
function orderLabels(labels) {
  const priority = [
    "react",
    "tailwind",
    "prisma",
    "supabase",
    "api-routes",
    "nodejs",
    "docker",
    "netlify",
    "nextjs",
    "vite",
    "node-api",
    "electron",
    "tauri",
    "chrome-extension",
    "monorepo-turborepo",
    "monorepo-pnpm"
  ];
  return labels.sort((a, b) => {
    const aIndex = priority.includes(a) ? priority.indexOf(a) : priority.length;
    const bIndex = priority.includes(b) ? priority.indexOf(b) : priority.length;
    return aIndex - bIndex || a.localeCompare(b);
  });
}
function directoryExists(cwd, relativePath, checked = /* @__PURE__ */ new Set()) {
  checked.add(relativePath);
  try {
    return fs2.statSync(path2.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}
function findWorkspaceHints(cwd) {
  const ignored = /* @__PURE__ */ new Set([".git", ".next", "dist", "build", "node_modules", "vendor", "target"]);
  let entries;
  try {
    entries = fs2.readdirSync(cwd, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((entry) => entry.isDirectory() && !ignored.has(entry.name)).map((entry) => childProjectHint(cwd, entry.name)).filter((hint2) => Boolean(hint2)).slice(0, 8);
}
function childProjectHint(cwd, name) {
  const child = path2.join(cwd, name);
  const files = listTopLevelFiles(child);
  const packageJson = readJsonSafe(path2.join(child, "package.json"));
  const evidence = [];
  const candidates = /* @__PURE__ */ new Set();
  if (files.has("turbo.json")) addHint(candidates, evidence, "monorepo-turborepo", "turbo.json");
  if (files.has("pnpm-workspace.yaml")) addHint(candidates, evidence, "monorepo-pnpm", "pnpm-workspace.yaml");
  const manifest = readJsonSafe(path2.join(child, "manifest.json"));
  if (manifest?.manifest_version) addHint(candidates, evidence, "chrome-extension", "manifest.json");
  if (hasDependency(packageJson, "next") || hasMatchingFile(files, /^next\.config\.(js|mjs|cjs|ts)$/)) {
    addHint(candidates, evidence, "nextjs", hasDependency(packageJson, "next") ? "package.json next" : "next.config.*");
  }
  if (hasDependency(packageJson, "vite") || hasMatchingFile(files, /^vite\.config\.(js|mjs|cjs|ts|mts|cts)$/)) {
    addHint(candidates, evidence, "vite", hasDependency(packageJson, "vite") ? "package.json vite" : "vite.config.*");
  }
  if (hasAnyDependency(packageJson, ["express", "fastify", "hono"])) {
    addHint(candidates, evidence, "node-api", "package.json API dependency");
  }
  if (hasDependency(packageJson, "react")) addHint(candidates, evidence, "react", "package.json react");
  if (hasDependency(packageJson, "electron")) addHint(candidates, evidence, "electron", "package.json electron");
  if (hasDependency(packageJson, "@tauri-apps/api") || files.has("src-tauri"))
    addHint(candidates, evidence, "tauri", "Tauri markers");
  if (packageJson?.bin) addHint(candidates, evidence, "node-cli", "package.json bin");
  if (files.has("pyproject.toml") || files.has("requirements.txt"))
    addHint(candidates, evidence, "python", "Python project files");
  if (files.has("composer.json")) addHint(candidates, evidence, "php", "composer.json");
  if (files.has("go.mod")) addHint(candidates, evidence, "go", "go.mod");
  if (files.has("Cargo.toml")) addHint(candidates, evidence, "rust", "Cargo.toml");
  const stack = pickPrimaryStack(candidates);
  if (stack === "generic") return null;
  return { path: name, stack, evidence };
}
function addHint(candidates, evidence, stack, reason) {
  candidates.add(stack);
  evidence.push(reason);
}
function hasMatchingFile(files, pattern) {
  return [...files].some((file2) => pattern.test(file2));
}
function detectPackageManager(cwd, stack) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-workspace.yaml")) return "pnpm";
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  if (stack.includes("laravel") || files.has("composer.json")) return "composer";
  if (stack.includes("go")) return "go";
  if (stack.includes("rust")) return "cargo";
  if (stack.includes("python") || files.has("pyproject.toml") || files.has("requirements.txt")) return "python";
  return "npm";
}
function detectTestCommand(cwd, packageJson, stack) {
  if (packageJson?.scripts?.test) return `${packageManagerCommand(cwd)} test`;
  if (stack.includes("laravel")) return "php artisan test";
  if (stack.includes("go")) return "go test ./...";
  if (stack.includes("rust")) return "cargo test";
  if (stack.includes("python")) return "python -m pytest";
  return "document the test command";
}
function detectBuildCommand(cwd, packageJson, stack) {
  if (packageJson?.scripts?.build) return `${packageManagerCommand(cwd)} run build`;
  if (stack.includes("laravel")) return "composer install && php artisan test";
  if (stack.includes("go")) return "go build ./...";
  if (stack.includes("rust")) return "cargo build";
  if (stack.includes("python")) return "python -m compileall .";
  return "document the build command";
}
function launchTargetFor(template) {
  const launchTargets = {
    "chrome-extension": "Chrome Web Store",
    "ai-saas": "Vercel or Netlify",
    saas: "Vercel or Netlify",
    marketplace: "Vercel or Netlify",
    "internal-tool": "Vercel, Netlify, or internal hosting",
    "electron-app": "Desktop release",
    "tauri-app": "Desktop release"
  };
  return launchTargets[template] ?? "GitHub";
}

// src/utils/logger.ts
import chalk from "chalk";
import ora from "ora";
var logger = {
  info(message) {
    console.log(chalk.cyan(message));
  },
  success(message) {
    console.log(`${chalk.green("success")} ${message}`);
  },
  warn(message) {
    console.log(`${chalk.yellow("warning")} ${message}`);
  },
  error(message) {
    console.error(`${chalk.red("error")} ${message}`);
  },
  muted(message) {
    console.log(chalk.gray(message));
  }
};
function createSpinner(message) {
  return ora({ text: message, spinner: "dots" });
}

// src/utils/ui.ts
import chalk2 from "chalk";
function header(title, subtitle) {
  const lines = [chalk2.bold.cyan(title)];
  if (subtitle) lines.push(chalk2.gray(subtitle));
  return lines.join("\n");
}
function section(title) {
  return chalk2.bold(title);
}
function bullet(value) {
  return `${chalk2.gray("-")} ${value}`;
}
function keyValue(key, value) {
  return `${chalk2.gray(`${key}:`)} ${value}`;
}
function command(value) {
  return chalk2.cyan(value);
}
function pathLabel(value) {
  return chalk2.cyan(value);
}
function muted(value) {
  return chalk2.gray(value);
}
function status(value) {
  if (value === "ready") return chalk2.green(value);
  if (value === "blocked") return chalk2.red(value);
  if (value === "needs-review") return chalk2.yellow(value);
  return value;
}
function score(value) {
  if (value >= 85) return chalk2.green(`${value}/100`);
  if (value >= 65) return chalk2.yellow(`${value}/100`);
  return chalk2.red(`${value}/100`);
}
function checkStatus(ok) {
  return ok ? chalk2.green("PASS") : chalk2.red("FAIL");
}
function nextSteps(steps) {
  return [section("Next steps:"), ...steps.map((step) => `  ${command(step)}`)].join("\n");
}
function errorMessage(message) {
  return `${chalk2.red("error")} ${message}`;
}
function hint(message) {
  return `${chalk2.gray("hint")} ${message}`;
}

// src/workflow/packs.ts
import path4 from "path";

// src/workflow/context.ts
import fs3 from "fs";
import path3 from "path";
import { execSync } from "child_process";

// src/utils/git.ts
import { execa } from "execa";
async function gitBranch(cwd) {
  try {
    const result = await execa("git", ["branch", "--show-current"], { cwd });
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

// src/workflow/context.ts
var MEMORY_FILES = [
  "AGENTS.md",
  "CURRENT_TASK.md",
  "ARCHITECTURE.md",
  "FEATURE_SUMMARIES.md",
  "WORKFLOW_RULES.md",
  "DECISIONS.md",
  "TASK_HISTORY.md"
];
var ALWAYS_LOAD = ["AGENTS.md", "CURRENT_TASK.md", "ARCHITECTURE.md", "FEATURE_SUMMARIES.md", "WORKFLOW_RULES.md"];
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
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
var IGNORED_DIRS = /* @__PURE__ */ new Set([
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
function buildFocusContext(cwd, input2 = "current task") {
  const profile = detectProject(cwd);
  const focus = normalizeFocusInput(input2);
  const explicitFiles = normalizeFileHints(focus.files ?? []);
  const scopedFiles = explicitFiles.length > 0 ? findExplicitScopedFiles(cwd, explicitFiles) : findScopedFiles(cwd, focus.scope);
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
async function buildWorkflowSummary(cwd, input2) {
  const profile = detectProject(cwd);
  const branch = await gitBranch(cwd);
  const summaryInput = normalizeSummaryInput(input2);
  const state = readWorkflowState(cwd);
  const stateScope = state?.activeScope && state.activeScope !== "current task" ? state.activeScope : void 0;
  const selectedScope = summaryInput.scope ?? stateScope ?? summaryInput.task ?? readActiveScope(cwd) ?? "current task";
  const task = summaryInput.task ?? state?.task ?? selectedScope;
  const scopedFiles = findScopedFiles(cwd, selectedScope).slice(0, 12);
  const memory = memoryDigest(cwd);
  const status2 = summaryInput.status ?? (summaryInput.handoff ? "handoff" : "complete");
  const changedFiles = knownChangedFiles(cwd, state, scopedFiles);
  const result = status2 === "handoff" ? "Prepared a compact handoff for the next coding-agent session." : "Compressed the current workflow state into durable memory.";
  const verificationState = verificationCommand(profile);
  const blocker = status2 === "blocked" ? "Blocked; add blocker detail before handoff." : "none captured";
  const nextStep = status2 === "handoff" ? `Paste the handoff into a fresh Codex chat and continue ${task}.` : "Run agentkick doctor.";
  const handoffText = handoffTextFor(profile, task, selectedScope, changedFiles, verificationState, blocker, nextStep);
  const appendedTo = appendTaskSummary(cwd, {
    task,
    scope: selectedScope,
    status: status2,
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
    status: status2,
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
function updateCurrentTask(cwd, profile, focus, files, uncertainty) {
  writeFile(
    cwd,
    "CURRENT_TASK.md",
    `# Current Task

## Status

Prepared focus context.

## Active Scope

- Task: ${focus.task}
- Task scope: ${focus.scope}
${focus.feature ? `- Feature: ${focus.feature}
` : ""}- Scope source: ${focus.files?.length ? "explicit files" : "task or feature text"}
- Project: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Scoped Files

${files.length > 0 ? files.map((file2) => `- ${file2.path}: ${file2.reason}`).join("\n") : "- No scoped files detected yet."}

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
function writeWorkflowState(cwd, profile, focus, files) {
  const state = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: focus.scope,
    task: focus.task,
    feature: focus.feature,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    stack: profile.stack,
    scopedFiles: files.map((file2) => file2.path)
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
}
function normalizeFocusInput(input2) {
  if (typeof input2 === "string") {
    return { scope: input2 || "current task", task: input2 || "current task", files: [] };
  }
  const files = normalizeFileHints(input2.files ?? []);
  const fallback = files.length > 0 ? "explicit file scope" : "current task";
  const task = input2.task?.trim() || input2.scope?.trim() || input2.feature?.trim() || fallback;
  const scope = input2.feature?.trim() || input2.scope?.trim() || task;
  return {
    scope,
    task,
    feature: input2.feature?.trim() || void 0,
    files
  };
}
function normalizeSummaryInput(input2) {
  if (!input2) return { handoff: false };
  if (typeof input2 === "string") return { scope: input2, task: void 0, handoff: false };
  return {
    scope: input2.scope?.trim() || void 0,
    task: input2.task?.trim() || void 0,
    handoff: Boolean(input2.handoff || input2.status === "handoff"),
    status: normalizeSummaryStatus(input2.status)
  };
}
function normalizeSummaryStatus(statusValue) {
  if (statusValue === "complete" || statusValue === "blocked" || statusValue === "handoff") return statusValue;
  return void 0;
}
function findExplicitScopedFiles(cwd, files) {
  const allFiles = scanFiles(cwd);
  const byPath = new Map(allFiles.map((file2) => [file2.path, file2]));
  const selected = [];
  for (const item of files) {
    const normalized = slash(item.replace(/^\.\/+/, ""));
    const fullPath = path3.join(cwd, normalized);
    if (directoryExists2(fullPath)) {
      selected.push(
        ...allFiles.filter((file2) => file2.path === normalized || file2.path.startsWith(`${normalized.replace(/\/$/, "")}/`)).slice(0, 24).map((file2) => ({ ...file2, reason: "inside explicit folder scope" }))
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
function findScopedFiles(cwd, scope) {
  const terms = tokenize(scope);
  const allFiles = scanFiles(cwd);
  const scored = allFiles.map((file2) => scoreFile(cwd, file2, terms)).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path)).slice(0, 16);
  if (scored.length === 0 && scope !== "current task") {
    return allFiles.filter((file2) => file2.path.includes(scope)).slice(0, 12).map((file2) => ({ ...file2, reason: "path contains scope" }));
  }
  return scored.map(({ file: file2, reasons }) => ({ ...file2, reason: reasons.slice(0, 2).join(", ") }));
}
function scanFiles(cwd) {
  const results = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs3.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path3.join(dir, entry.name);
      const relativePath = slash(path3.relative(cwd, fullPath));
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path3.extname(entry.name).toLowerCase();
      if (isAgentMemoryPath(relativePath)) continue;
      if (!SOURCE_EXTENSIONS.has(extension)) continue;
      const stats = fs3.statSync(fullPath);
      if (stats.size > 4e5) continue;
      results.push({ path: relativePath, lines: lineCount(readFileSafe(fullPath)), exists: true });
    }
  };
  walk(cwd);
  return results;
}
function scoreFile(cwd, file2, terms) {
  const lowerPath = file2.path.toLowerCase();
  const reasons = [];
  let score2 = 0;
  for (const term of terms) {
    if (lowerPath.includes(term)) {
      score2 += lowerPath.split("/").some((part) => part.includes(term)) ? 8 : 4;
      reasons.push(`path matches "${term}"`);
    }
  }
  if (score2 === 0 && terms.length > 0 && file2.lines < 900) {
    const content = readFileSafe(path3.join(cwd, file2.path)).toLowerCase();
    for (const term of terms) {
      if (content.includes(term)) {
        score2 += 2;
        reasons.push(`content mentions "${term}"`);
        break;
      }
    }
  }
  if (score2 > 0 && (lowerPath.includes("readme") || lowerPath.endsWith("route.ts") || lowerPath.endsWith("api.ts"))) {
    score2 += 1;
  }
  if (score2 > 0 && lowerPath.startsWith("src/")) score2 += 3;
  if (score2 > 0 && lowerPath.startsWith("docs/")) score2 -= 8;
  if (score2 > 0 && (lowerPath === "readme.md" || lowerPath === "changelog.md" || lowerPath === "claude.md")) score2 -= 3;
  return { file: file2, score: score2, reasons: reasons.length > 0 ? reasons : ["near scope"] };
}
function memoryDigest(cwd) {
  return MEMORY_FILES.filter((file2) => fs3.existsSync(path3.join(cwd, file2))).map((file2) => {
    const content = readFileSafe(path3.join(cwd, file2));
    return `${file2}: ${compressText(content, 180)}`;
  });
}
function boundariesFor(scope, files) {
  const roots = [...new Set(files.map((file2) => file2.path.split("/").slice(0, 3).join("/")))].slice(0, 5);
  return [
    `Primary task scope is "${scope}".`,
    roots.length > 0 ? `Prefer these boundaries: ${roots.join(", ")}.` : "No source boundary was detected yet.",
    "Never paste full source files into the agent chat.",
    "Do not edit generated, build, dependency, or unrelated files.",
    "Run the documented test/build command after changes when possible."
  ];
}
function freshChatSummary(profile, scope, files, memory) {
  return [
    `${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared with AgentKick.`,
    `Current scope: ${scope}.`,
    files.length > 0 ? `Relevant files: ${files.map((file2) => file2.path).join(", ")}.` : "Relevant files are not identified yet.",
    `Verification: ${profile.testCommand}; build: ${profile.buildCommand}.`,
    `Memory: ${memory.map((item) => item.replace(/\s+/g, " ")).slice(0, 4).join(" ")}`
  ].join("\n");
}
function handoffTextFor(profile, task, scope, changedFiles, verificationState, blocker, nextStep) {
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
function appendTaskSummary(cwd, entry) {
  const file2 = "TASK_HISTORY.md";
  const existingContent = readFileSafe(path3.join(cwd, file2)) || "# Task History\n\n## Entries\n";
  const date = (/* @__PURE__ */ new Date()).toISOString();
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
  writeFile(cwd, file2, `${existingContent.trimEnd()}
${block}`);
  return file2;
}
function knownChangedFiles(cwd, state, scopedFiles) {
  const fromState = state?.scopedFiles ?? [];
  if (fromState.length > 0) return fromState.slice(0, 20);
  const fromScope = scopedFiles.map((file2) => file2.path).slice(0, 20);
  if (fromScope.length > 0) return fromScope;
  try {
    const output = execSync("git diff --name-only", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output.split(/\r?\n/).map((file2) => slash(file2.trim())).filter(Boolean).slice(0, 20);
  } catch {
    return [];
  }
}
function uncertaintyFor(focus, files, explicitFiles) {
  const warnings = [];
  if (explicitFiles.length > 0) warnings.push("Explicit --files scope is being used as the source of truth.");
  if (files.length === 0) warnings.push("No task files were found; start by confirming entry points before editing.");
  if (files.length > 12) warnings.push("Scope is broad; split the task or pass fewer explicit files.");
  if (files.some((file2) => !file2.exists)) warnings.push("Some explicit file hints were not found on disk.");
  if (focus.task.trim().split(/\s+/).length < 3) warnings.push("Task text is short; file selection is best-effort.");
  return warnings.length > 0 ? warnings : ["No major uncertainty detected from the provided scope."];
}
function avoidPathsFor(cwd) {
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
    return directoryExists2(path3.join(cwd, normalized)) || ["node_modules/", "dist/", "build/", ".agentkick/"].includes(item);
  });
  return [...new Set(existingPaths)];
}
function verificationCommand(profile) {
  if (profile.testCommand && !profile.testCommand.startsWith("document ")) return profile.testCommand;
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "document the narrowest useful verification command before editing";
}
function buildCommand(profile) {
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "not detected";
}
function readWorkflowState(cwd) {
  return readJsonSafe(path3.join(cwd, ".agentkick", "workflow-state.json"));
}
function readActiveScope(cwd) {
  const state = readWorkflowState(cwd);
  if (state?.activeScope && state.activeScope !== "none") return state.activeScope;
  const currentTask = readFileSafe(path3.join(cwd, "CURRENT_TASK.md"));
  const match = currentTask.match(/Task scope:\s*(.+)/i);
  return match?.[1]?.trim() || null;
}
function existing(cwd, files) {
  return files.filter((file2) => fs3.existsSync(path3.join(cwd, file2)));
}
function tokenize(value) {
  const terms = value.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length >= 2 && !["the", "and", "for", "with", "task", "current"].includes(part));
  const aliases = {
    cli: ["command", "commands", "commander", "program"],
    auth: ["login", "session", "user", "account"],
    api: ["route", "routes", "server", "service"],
    workflow: ["workflows", "state", "task"],
    workflows: ["workflow", "state", "task"]
  };
  return [...new Set(terms.flatMap((term) => [term, ...aliases[term] ?? []]))];
}
function normalizeFileHints(files) {
  return [
    ...new Set(
      files.map((file2) => slash(file2.trim())).filter(Boolean).map((file2) => file2.replace(/^\.\/+/, ""))
    )
  ];
}
function dedupeScopedFiles(files) {
  const seen = /* @__PURE__ */ new Set();
  return files.filter((file2) => {
    if (seen.has(file2.path)) return false;
    seen.add(file2.path);
    return true;
  });
}
function readFileSafe(file2) {
  try {
    return fs3.readFileSync(file2, "utf8");
  } catch {
    return "";
  }
}
function lineCount(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}
function compressText(content, maxLength) {
  const compact = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 3)}...`;
}
function isAgentMemoryPath(relativePath) {
  return MEMORY_FILES.includes(relativePath) || relativePath === ".agentkick.json" || relativePath.startsWith(".github/") || relativePath.startsWith(".claude/") || relativePath.startsWith(".codex/") || relativePath.startsWith(".agents/") || relativePath.startsWith(".cursor/");
}
function directoryExists2(directory) {
  try {
    return fs3.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}
function quoteShell(value) {
  return `"${value.replace(/"/g, '\\"')}"`;
}
function slash(value) {
  return value.replace(/\\/g, "/");
}

// src/workflow/context-render.ts
function renderFocus(context) {
  const lines = [
    header("AgentKick focus", "Paste-ready task brief for a coding agent."),
    "",
    section("Task:"),
    context.task,
    "",
    context.feature ? keyValue("Feature", context.feature) : "",
    keyValue("Scope", context.scope),
    keyValue("Detected stack", context.profile.primaryStack ?? context.profile.template),
    context.profile.capabilities?.length ? keyValue("Detected capabilities", context.profile.capabilities.join(", ")) : "",
    "",
    section("Load first:"),
    ...context.loadFirst.map((file2) => bullet(pathLabel(file2))),
    "",
    section("Task files:"),
    ...context.scopedFiles.length > 0 ? context.scopedFiles.map(
      (file2) => bullet(`${pathLabel(file2.path)} (${file2.exists ? `${file2.lines} lines` : "not found"}; ${file2.reason})`)
    ) : [bullet("No scoped source files found. Start from the memory files above.")],
    "",
    section("Avoid paths:"),
    ...context.avoidPaths.map((item) => bullet(pathLabel(item))),
    "",
    section("Known memory files:"),
    ...context.memoryFiles.map((item) => bullet(pathLabel(item))),
    "",
    keyValue("Verification", context.verificationCommand),
    keyValue("Build", context.buildCommand),
    "",
    section("Execution boundaries:"),
    ...context.boundaries.map((boundary) => bullet(boundary)),
    "",
    section("Uncertainty:"),
    ...context.uncertainty.map((item) => bullet(item)),
    "",
    section("Compressed memory:"),
    ...context.memory.map((item) => bullet(item)),
    "",
    section("Agent-ready prompt:"),
    [
      `Task: ${context.task}`,
      `Read first: ${context.loadFirst.join(", ") || "AGENTS.md, WORKFLOW_RULES.md"}.`,
      `Work in task files only: ${context.scopedFiles.map((file2) => file2.path).join(", ") || "scope not confirmed"}.`,
      `Avoid: ${context.avoidPaths.join(", ")}.`,
      `Verify with: ${context.verificationCommand}.`,
      "Do not copy full source files into chat. Expand scope only when the code path proves it is required."
    ].join("\n"),
    "",
    keyValue("Suggested next command", command(context.nextCommand))
  ];
  return lines.filter((line) => line !== "").join("\n");
}
function renderSummary(summary) {
  const lines = [
    header("AgentKick summary", "Fresh-chat handoff for the current workflow state."),
    "",
    keyValue("Project", summary.project),
    summary.branch ? keyValue("Git branch", summary.branch) : "",
    keyValue("Task", summary.task),
    keyValue("Status", summary.status),
    keyValue("Scope", summary.scope),
    keyValue("Stack", summary.stack),
    summary.capabilities.length ? keyValue("Capabilities", summary.capabilities.join(", ")) : "",
    keyValue("Package manager", summary.packageManager),
    keyValue("Result", summary.result),
    keyValue("Verification state", summary.verificationState),
    keyValue("Blocker", summary.blocker),
    keyValue("Next step", summary.nextStep),
    keyValue("Appended to", summary.appendedTo),
    "",
    section("Changed files if known:"),
    ...summary.changedFiles.length > 0 ? summary.changedFiles.map((file2) => bullet(pathLabel(file2))) : [bullet("None known from workflow state or git diff.")],
    "",
    section("Memory digest:"),
    ...summary.memory.map((item) => bullet(item)),
    "",
    section(summary.handoff ? "Fresh-chat handoff:" : "Fresh-chat summary:"),
    summary.handoff ? summary.handoffText : summary.freshChatSummary
  ];
  return lines.filter((line) => line !== "").join("\n");
}

// src/workflow/memory.ts
function writeWorkflowMemoryFiles(cwd, profile) {
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
function writeInitialWorkflowState(cwd, profile) {
  const state = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: "none",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    stack: profile.stack,
    scopedFiles: []
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
}

// src/templates/agent-files.ts
function writeAgentFiles(cwd, profile, options = {}) {
  if (options.includeWorkflowMemory ?? true) writeWorkflowMemoryFiles(cwd, profile);
  writeFile(cwd, "AGENTS.md", agentsMd(profile));
  writeFile(cwd, "CLAUDE.md", claudeMd(profile));
  writeFile(cwd, ".github/copilot-instructions.md", copilotInstructions(profile));
  writeGithubInstructions(cwd, profile);
  writeClaudeSkills(cwd, profile);
  writeGenericSkills(cwd, profile);
  writeCodexAgents(cwd, profile);
  writeFile(cwd, ".cursor/rules/agentkick.mdc", cursorRules(profile));
  writeFile(
    cwd,
    ".agentkick.json",
    json({
      schemaVersion: 1,
      name: profile.name,
      stack: profile.stack,
      packageManager: profile.packageManager,
      testCommand: profile.testCommand,
      buildCommand: profile.buildCommand,
      launchTarget: profile.launchTarget,
      packs: profile.packs ?? ["core"],
      safety: {
        preserveBackups: true,
        mcpFilesystemScope: "repo",
        destructiveActionsRequireApproval: true
      }
    })
  );
}
function readmeFor(profile) {
  return `# ${titleize(profile.name)}

Generated with AgentKick.

## Quick Start

\`\`\`bash
${installCommand(profile)}
${profile.testCommand}
agentkick doctor
agentkick focus
\`\`\`

## AI Workflow Memory

This repo includes:

- \`AGENTS.md\` for Codex and other coding agents
- \`CURRENT_TASK.md\` for active execution state
- \`ARCHITECTURE.md\` for repo boundaries and ownership
- \`FEATURE_SUMMARIES.md\` for compact feature memory
- \`WORKFLOW_RULES.md\` for context discipline
- \`DECISIONS.md\` and \`TASK_HISTORY.md\` for durable project memory
- \`CLAUDE.md\` for Claude Code
- \`.claude/skills\` reusable Claude engineering playbooks
- \`.claude/agents\` specialist agents
- \`.agents/skills\` multi-agent workflow skills
- \`.codex/agents\` Codex specialist agent instructions
- \`.cursor/rules\` for Cursor
- \`.github/copilot-instructions.md\` for GitHub Copilot
- \`.github/instructions\` path-specific Copilot instructions

## Commands

\`\`\`bash
${profile.testCommand}
${profile.buildCommand}
\`\`\`

## Example Workflow

\`\`\`bash
agentkick focus <feature-or-task>
# make the smallest scoped change
${profile.testCommand}
agentkick summarize
\`\`\`

## AgentKick

\`\`\`bash
agentkick doctor
agentkick focus
agentkick summarize
agentkick add security
\`\`\`
`;
}
function launchChecklist(profile) {
  return `# Launch Checklist

- Confirm the product promise is clear in README or landing page.
- Run verification: \`${profile.testCommand}\`.
- Run build: \`${profile.buildCommand}\`.
- Check secrets are not committed.
- Check deploy root is correct.
- Tag a release after the first working public version.
- Add screenshots or a short demo GIF before asking for stars.
`;
}
function agentsMd(profile) {
  return `# AGENTS.md

## Project

${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared with AgentKick.

## Purpose

This repository must be understandable by autonomous coding agents before they modify code.

## Architecture

- Stack: ${profile.stack.join(", ") || "generic"}
- Package manager: ${profile.packageManager}
- Launch target: ${profile.launchTarget}
- Agent metadata: .agentkick.json

## Commands

- Test: ${profile.testCommand}
- Build: ${profile.buildCommand}
- Doctor: agentkick doctor

## Agent Operating Rules

- Understand the current code path before editing.
- Prefer small, reviewable changes over broad rewrites.
- Do not introduce secrets into committed files.
- Preserve existing user changes and do not revert unrelated work.
- After code edits, run the narrowest useful verification command.
- If verification cannot run, state the exact blocker.
- Never modify generated, vendor, build, or lock files unless the task explicitly requires it.
- Do not change deployment, auth, billing, permissions, or database schema without calling out migration impact.
- Treat broad filesystem, shell, and MCP permissions as security risks.

## Forbidden By Default

- Committing secrets, tokens, private keys, or real credentials.
- Hiding failing tests or deleting tests to make checks pass.
- Rewriting large unrelated areas during a focused fix.
- Adding dependencies without explaining why the existing stack is insufficient.

## Review Expectations

- Findings and risks first.
- Use file paths and concrete behavior, not vague advice.
- Prefer reproducible commands over assumptions.

## Stack Notes

${stackNotes(profile).map((note) => `- ${note}`).join("\n")}
`;
}
function claudeMd(profile) {
  return `# CLAUDE.md

This repository is configured for Claude Code.

## How To Work Here

- Start by reading \`AGENTS.md\`.
- Use project commands from \`.claude/commands\` when they match the task.
- Use playbooks from \`.claude/skills\` for review, debugging, tests, and security scans.
- Use specialist agents from \`.claude/agents\` for review, security, frontend, deploy, or stack-specific work.
- Preserve user changes. Do not overwrite files without considering ownership.
- Keep final answers concise and include verification status.

## Project Facts

- Name: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Test command: ${profile.testCommand}
- Build command: ${profile.buildCommand}
- Launch target: ${profile.launchTarget}

## Required Workflow

1. Inspect the relevant files before editing.
2. Make the smallest safe change.
3. Run the narrowest useful verification command.
4. Report any skipped verification with the exact reason.
`;
}
function copilotInstructions(profile) {
  return `# GitHub Copilot Instructions

Follow the repository rules in \`AGENTS.md\`.

- Keep changes small and consistent with the detected stack: ${profile.stack.join(", ") || "generic"}.
- Prefer existing scripts over new tooling.
- Do not add dependencies unless the task clearly requires them.
- Validate external input and avoid leaking secrets.
- Verify with: ${profile.testCommand}
`;
}
function writeGithubInstructions(cwd, profile) {
  writeFile(
    cwd,
    ".github/instructions/frontend.instructions.md",
    githubInstruction("frontend", "**/*.{tsx,jsx,css,html}", [
      "Preserve established design patterns unless the task asks for a redesign.",
      "Keep UI accessible: semantic markup, labels, keyboard interaction, and readable contrast.",
      "Do not move client-side secrets into frontend files."
    ])
  );
  writeFile(
    cwd,
    ".github/instructions/backend.instructions.md",
    githubInstruction("backend", "**/*.{js,ts,py,php,go,rs}", [
      "Validate all external input before using it.",
      "Keep auth, billing, permission, and database changes explicit and reviewable.",
      `Verify behavior with ${profile.testCommand}.`
    ])
  );
  writeFile(
    cwd,
    ".github/instructions/typescript.instructions.md",
    githubInstruction("typescript", "**/*.{ts,tsx}", [
      "Avoid any unless the reason is documented at the use site.",
      "Prefer explicit return types for exported functions.",
      "Keep server/client boundaries strict."
    ])
  );
  writeFile(
    cwd,
    ".github/instructions/security.instructions.md",
    githubInstruction("security", "**/*", [
      "Never commit secrets, tokens, private keys, or production credentials.",
      "Treat broad shell, filesystem, and MCP access as high-risk.",
      "Do not log sensitive user data."
    ])
  );
}
function writeClaudeSkills(cwd, profile) {
  const skills = {
    review: [
      "Inspect git diff or changed files.",
      "Check behavior, edge cases, tests, security, and deployment impact.",
      "Report risks first with file references.",
      "Avoid broad summaries until findings are complete."
    ],
    debug: [
      "Reproduce or identify the failing path.",
      "Find the smallest root cause.",
      "Patch only the relevant code path.",
      `Verify with ${profile.testCommand} or explain why it cannot run.`
    ],
    "write-tests": [
      "Identify behavior that can regress.",
      "Add focused tests before broad refactors.",
      "Prefer existing test style and helpers.",
      `Run ${profile.testCommand}.`
    ],
    "security-scan": [
      "Trace inputs to sensitive sinks.",
      "Check secrets, auth, permissions, injection, and MCP/tool access.",
      "Validate exploitability before assigning severity.",
      "Recommend concrete remediation."
    ]
  };
  for (const [name, steps] of Object.entries(skills)) {
    writeFile(cwd, `.claude/skills/${name}/SKILL.md`, skillMarkdown(name, steps));
  }
}
function writeGenericSkills(cwd, profile) {
  writeFile(
    cwd,
    ".agents/skills/review/SKILL.md",
    skillMarkdown("review", [
      "Read AGENTS.md first.",
      "Review only the scoped change.",
      "Prioritize bugs, regressions, missing tests, and security risks.",
      `Use ${profile.testCommand} for verification when possible.`
    ])
  );
  writeFile(
    cwd,
    ".agents/skills/release/SKILL.md",
    skillMarkdown("release", [
      "Run tests and build.",
      "Check launch checklist and deployment notes.",
      "Verify secrets are not committed.",
      "Prepare concise release notes."
    ])
  );
}
function writeCodexAgents(cwd, profile) {
  const agents = {
    reviewer: "Review diffs for bugs, regressions, missing tests, and security risks. Do not rewrite code.",
    "test-writer": `Add focused tests using existing conventions. Verify with ${profile.testCommand}.`,
    "migration-expert": "Review schema, dependency, or framework migrations. Call out rollback and compatibility risks.",
    "docs-researcher": "Research documentation gaps and update repo docs without changing product behavior.",
    "performance-optimizer": "Optimize only measured bottlenecks. Preserve behavior and add verification notes."
  };
  for (const [name, purpose] of Object.entries(agents)) {
    writeFile(cwd, `.codex/agents/${name}.md`, codexAgent(name, purpose, profile));
  }
}
function githubInstruction(name, applyTo, rules) {
  return `---
applyTo: "${applyTo}"
---

# ${name} instructions

${rules.map((rule) => `- ${rule}`).join("\n")}
`;
}
function skillMarkdown(name, steps) {
  return `---
description: ${name.replace(/-/g, " ")} workflow for disciplined AI coding agents.
---

# ${name}

${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`;
}
function codexAgent(name, purpose, profile) {
  return `# ${name}

## Purpose

${purpose}

## Scope

- Repository: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Forbidden Actions

- Do not revert unrelated user changes.
- Do not commit secrets or credentials.
- Do not perform destructive filesystem or git actions without explicit approval.
- Do not broaden scope beyond the assigned task.

## Workflow

1. Read AGENTS.md.
2. Inspect relevant files.
3. Make or recommend the smallest safe change.
4. Verify or report the exact verification blocker.
`;
}
function cursorRules(profile) {
  return `---
description: AgentKick repo rules
alwaysApply: true
---

# AgentKick Rules

Read AGENTS.md before making broad edits.

- Stack: ${profile.stack.join(", ") || "generic"}
- Test command: ${profile.testCommand}
- Build command: ${profile.buildCommand}
- Avoid secrets in source code.
- Preserve existing style and architecture unless asked to redesign.
`;
}
function stackNotes(profile) {
  const notes = [];
  if (profile.stack.includes("chrome-extension"))
    notes.push(
      "Chrome extension: preserve least-privilege manifest permissions and verify popup behavior in a constrained viewport."
    );
  if (profile.stack.includes("nextjs"))
    notes.push("Next.js: keep server/client component boundaries explicit and run a production build before shipping.");
  if (profile.stack.includes("netlify"))
    notes.push("Netlify: verify publish directory and build command from the site root before deploying.");
  if (profile.stack.includes("docker"))
    notes.push(
      "Docker: avoid changing exposed ports, volumes, or environment contracts without documenting migration impact."
    );
  if (profile.stack.includes("python"))
    notes.push(
      "Python: prefer existing dependency and formatting tools detected in the repo, and verify API behavior with pytest when available."
    );
  if (profile.stack.includes("fastapi"))
    notes.push("FastAPI: validate route schemas, status codes, and production server settings before shipping.");
  if (profile.stack.includes("flask"))
    notes.push("Flask: keep app factory patterns clean and avoid storing secrets in config defaults.");
  if (profile.stack.includes("laravel"))
    notes.push(
      "Laravel: preserve framework conventions, review migrations carefully, and verify with php artisan test."
    );
  if (profile.stack.includes("go"))
    notes.push("Go: prefer explicit errors, table-driven tests, and go test ./... before releases.");
  if (profile.stack.includes("rust"))
    notes.push("Rust: avoid unsafe code unless justified and verify with cargo test before releases.");
  if (profile.stack.includes("electron"))
    notes.push(
      "Electron: keep main, preload, and renderer boundaries strict; avoid broad IPC or Node access in renderer code."
    );
  if (profile.stack.includes("tauri"))
    notes.push("Tauri: keep Rust commands narrow, capabilities minimal, and frontend/native bridge behavior explicit.");
  if (notes.length === 0)
    notes.push("Generic: document missing commands before assuming test, build, or deploy behavior.");
  return notes;
}
function titleize(value) {
  return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function installCommand(profile) {
  if (profile.packageManager === "npm") return "npm install";
  if (profile.packageManager === "pnpm") return "pnpm install";
  if (profile.packageManager === "yarn") return "yarn install";
  return "# install project dependencies";
}

// src/workflow/packs.ts
var PACKS = {
  core(profile) {
    return [
      command2(
        "review",
        "Review the current changes like a senior engineer. Prioritize bugs, regressions, missing tests, security risks, and unclear behavior. Use file and line references where possible."
      ),
      command2(
        "write-tests",
        `Add or update tests for the current change. Use this project's documented test command: ${profile.testCommand}. If no test harness exists, explain the smallest practical test setup before adding dependencies.`
      ),
      command2(
        "fix-ci",
        "Inspect the failing CI or local command output, identify the smallest root-cause fix, apply it, and rerun the relevant verification command."
      ),
      command2(
        "explain-codebase",
        "Explain this codebase for a new maintainer. Cover entry points, important directories, commands, deploy path, and risk areas."
      ),
      agent(
        "code-reviewer",
        "Use this agent for code review, PR review, regression analysis, and quality checks.",
        "You are a strict code reviewer. Findings come first. Focus on behavioral bugs, regressions, missing tests, security issues, and deploy risks. Do not summarize unless findings are complete."
      )
    ];
  },
  "chrome-extension": () => [
    command2(
      "chrome-extension-check",
      "Review the Chrome extension for manifest issues, popup sizing, service worker lifecycle bugs, unsafe permissions, content-script mistakes, and packaging readiness."
    ),
    agent(
      "chrome-extension-engineer",
      "Use this agent for Chrome extension popup, background service worker, manifest, content script, and Web Store packaging work.",
      "You are a Chrome extension engineer. Preserve least-privilege permissions, verify popup viewport behavior, avoid exposing secrets, and check manifest v3 service worker constraints."
    )
  ],
  nextjs: () => [
    command2(
      "nextjs-audit",
      "Audit the Next.js app for routing, server/client component boundaries, accessibility, metadata, bundle risks, and build failures."
    ),
    agent(
      "nextjs-engineer",
      "Use this agent for Next.js app router, React UI, data loading, and deployment issues.",
      "You are a Next.js engineer. Respect existing component patterns, keep server/client boundaries clear, and run type/build checks after changes."
    )
  ],
  netlify: (profile) => [
    command2(
      "debug-netlify-deploy",
      "Debug the Netlify deploy path. Check netlify.toml, publish directory, build command, environment variables, redirects, and whether the deploy ran from the correct working directory."
    ),
    file("docs/launch-checklist.md", launchChecklist(profile))
  ],
  security: () => [
    command2(
      "security-scan",
      "Perform a practical security review. Focus on secrets, auth bypass, injection, dependency risks, unsafe MCP config, exposed admin surfaces, and user-data handling."
    ),
    agent(
      "security-auditor",
      "Use this agent for security review and threat modeling.",
      "You are a security auditor. Validate exploitability before escalating severity. Prefer concrete attack paths and precise remediation."
    )
  ],
  python: () => [
    command2(
      "python-api-check",
      "Review the Python API for dependency hygiene, route behavior, validation, error handling, test coverage, and production server readiness."
    ),
    agent(
      "python-api-engineer",
      "Use this agent for FastAPI, Flask, Python packaging, pytest, and API deployment work.",
      "You are a Python API engineer. Keep dependencies minimal, prefer pytest for verification, validate request/response behavior, and avoid leaking secrets through logs or config."
    )
  ],
  php: () => [
    command2(
      "php-laravel-check",
      "Review the PHP/Laravel app for routing, validation, migrations, auth, config caching, queue behavior, and test coverage."
    ),
    agent(
      "laravel-engineer",
      "Use this agent for Laravel, Composer, Artisan, routing, migrations, and PHP test workflows.",
      "You are a Laravel engineer. Preserve framework conventions, avoid editing generated vendor files, check migrations carefully, and verify with php artisan test when available."
    )
  ],
  go: () => [
    command2(
      "go-check",
      "Review the Go project for package layout, error handling, concurrency risks, CLI behavior, test coverage, and release readiness."
    ),
    agent(
      "go-engineer",
      "Use this agent for Go CLI, API, module, testing, and release work.",
      "You are a Go engineer. Keep APIs small, return explicit errors, prefer table-driven tests, and verify with go test ./... before shipping."
    )
  ],
  rust: () => [
    command2(
      "rust-check",
      "Review the Rust project for ownership issues, error handling, CLI behavior, unsafe code, tests, and release readiness."
    ),
    agent(
      "rust-engineer",
      "Use this agent for Rust CLI, crates, tests, and release work.",
      "You are a Rust engineer. Avoid unsafe code unless justified, prefer clear Result-based errors, keep dependencies lean, and verify with cargo test."
    )
  ],
  electron: () => [
    command2(
      "electron-check",
      "Review the Electron app for main/preload/renderer boundaries, context isolation, IPC safety, packaging, auto-update risks, and desktop UX."
    ),
    agent(
      "electron-engineer",
      "Use this agent for Electron desktop apps, preload scripts, IPC, renderer UI, and packaging work.",
      "You are an Electron engineer. Keep Node access out of the renderer, use preload boundaries carefully, avoid broad IPC channels, and verify syntax before packaging."
    )
  ],
  tauri: () => [
    command2(
      "tauri-check",
      "Review the Tauri app for Rust command boundaries, capability permissions, frontend/native bridge safety, packaging setup, and desktop UX."
    ),
    agent(
      "tauri-engineer",
      "Use this agent for Tauri desktop apps, Rust commands, capability permissions, frontend integration, and packaging work.",
      "You are a Tauri engineer. Keep permissions minimal, expose narrow commands, avoid broad filesystem access, and verify both TypeScript and Rust boundaries before packaging."
    )
  ],
  github: () => [
    file(
      ".github/workflows/agentkick-check.yml",
      "name: AgentKick Check\n\non:\n  pull_request:\n  push:\n    branches: [main]\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm install\n      - run: npm test\n"
    ),
    file(
      ".github/ISSUE_TEMPLATE/bug_report.md",
      "---\nname: Bug report\nabout: Report a reproducible problem\n---\n\n## Problem\n\n## Steps to reproduce\n\n## Expected behavior\n\n## Logs or screenshots\n"
    )
  ]
};
function writePack(cwd, pack, profile, options = {}) {
  if (!isPack(pack)) throw new Error(`pack writer missing for "${pack}"`);
  const entries = PACKS[pack]?.(profile);
  if (!entries) throw new Error(`pack writer missing for "${pack}"`);
  for (const entry of entries) {
    if (entry.kind === "command") writeClaudeCommand(cwd, entry.name, entry.body);
    if (entry.kind === "agent") writeClaudeAgent(cwd, entry.name, entry.description, entry.body);
    if (entry.kind === "file") writeFile(cwd, entry.path, entry.content);
  }
  if (options.updateConfig !== false) updateAgentkickConfig(cwd, { addedPacks: [pack] });
}
function command2(name, body) {
  return { kind: "command", name, body };
}
function agent(name, description, body) {
  return { kind: "agent", name, description, body };
}
function file(filePath, content) {
  return { kind: "file", path: filePath, content };
}
function writeClaudeCommand(cwd, name, body) {
  writeFile(cwd, `.claude/commands/${name}.md`, `---
description: ${name.replace(/-/g, " ")}
---

${body}
`);
}
function writeClaudeAgent(cwd, name, description, body) {
  writeFile(cwd, `.claude/agents/${name}.md`, `---
name: ${name}
description: ${description}
---

${body}
`);
}
function updateAgentkickConfig(cwd, patch) {
  const filePath = path4.join(cwd, ".agentkick.json");
  const current = readJsonSafe(filePath) ?? {};
  const packs = /* @__PURE__ */ new Set([...current.packs ?? [], ...patch.addedPacks ?? []]);
  current.packs = [...packs].sort();
  writeAbsoluteFile(filePath, json(current));
}
function isPack(value) {
  return Object.prototype.hasOwnProperty.call(PACKS, value);
}

// src/commands/shared.ts
function applyWriteMode(program, options = {}) {
  const globalOptions = program.opts();
  setWriteMode({ dryRun: Boolean(options.dryRun ?? globalOptions.dryRun) });
}
function isDryRun(program, options = {}) {
  const globalOptions = program.opts();
  return Boolean(options.dryRun ?? globalOptions.dryRun);
}

// src/commands/add.ts
function registerAddCommand(program, context) {
  program.command("add").description("Add focused workflow instructions for a stack or concern.").argument("<pack>", `pack: ${SUPPORTED_PACKS.join(", ")}`).addHelpText(
    "after",
    `

Examples:
  $ agentkick add github
  $ agentkick add security
  $ agentkick add chrome-extension
`
  ).action((pack) => {
    applyWriteMode(program);
    if (!isPack2(pack)) throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
    const profile = detectProject(context.cwd);
    writePack(context.cwd, pack, profile);
    logger.success(`Added ${pack} pack.`);
    console.log(nextSteps(["git diff", "agentkick doctor"]));
  });
}
function isPack2(value) {
  return SUPPORTED_PACKS.includes(value);
}

// src/doctor/doctor-engine.ts
import fs8 from "fs";
import path9 from "path";

// src/doctor/constants.ts
var REQUIRED_AGENT_FILES = [
  ["AGENTS.md", "agent operating rules"],
  ["WORKFLOW_RULES.md", "workflow rules"],
  [".agentkick.json", "AgentKick config"]
];
var OPTIONAL_AGENT_FILES = [
  ["CLAUDE.md", "Claude memory"],
  [".github/copilot-instructions.md", "Copilot root instructions"],
  [".cursor/rules/agentkick.mdc", "Cursor rules"]
];
var WORKFLOW_MEMORY_FILES = [
  "AGENTS.md",
  "CURRENT_TASK.md",
  "ARCHITECTURE.md",
  "FEATURE_SUMMARIES.md",
  "WORKFLOW_RULES.md",
  "DECISIONS.md",
  "TASK_HISTORY.md"
];
var SOURCE_EXTENSIONS2 = /* @__PURE__ */ new Set([
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
var SCAN_IGNORED_DIRS = /* @__PURE__ */ new Set([
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
var GENERATED_VENDOR_CANDIDATES = [
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

// src/doctor/checks.ts
import fs4 from "fs";
import path5 from "path";
function requiredFile(cwd, relativePath, label) {
  const fullPath = path5.join(cwd, relativePath);
  if (!fs4.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs4.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}
function optionalFile(cwd, relativePath, label) {
  const fullPath = path5.join(cwd, relativePath);
  if (!fs4.existsSync(fullPath)) return { ok: true, label, message: `optional: ${relativePath} not present` };
  const content = fs4.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

// src/doctor/findings.ts
import fs7 from "fs";
import path8 from "path";

// src/doctor/scanner.ts
import fs6 from "fs";
import path7 from "path";

// src/doctor/utils.ts
import fs5 from "fs";
import path6 from "path";
function pathCoveredByGuidance(item, guidance) {
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
function commandFor(profileCommand, scriptName, packageScript) {
  if (profileCommand && !profileCommand.startsWith("document ")) return profileCommand;
  if (packageScript) return scriptName === "test" ? "npm test" : "npm run build";
  return "not detected";
}
function readFileSafe2(file2) {
  try {
    return fs5.readFileSync(file2, "utf8");
  } catch {
    return "";
  }
}
function lineCount2(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}
function directoryExists3(cwd, relativePath) {
  try {
    return fs5.statSync(path6.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}
function isMemoryFile(relativePath) {
  return relativePath.endsWith(".md") || relativePath === ".agentkick.json";
}
function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "root";
}
function slash2(value) {
  return value.replace(/\\/g, "/");
}
function fallbackDetection(cwd, stack, detected) {
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

// src/doctor/scanner.ts
function scanRepoFiles(cwd) {
  const results = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs6.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path7.join(dir, entry.name);
      const relativePath = slash2(path7.relative(cwd, fullPath));
      if (entry.isDirectory()) {
        if (!SCAN_IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path7.extname(entry.name).toLowerCase();
      if (!SOURCE_EXTENSIONS2.has(extension) && !isMemoryFile(relativePath)) continue;
      const stats = fs6.statSync(fullPath);
      if (stats.size > 7e5) continue;
      const content = readFileSafe2(fullPath);
      results.push({
        relativePath,
        absolutePath: fullPath,
        extension,
        bytes: stats.size,
        lines: lineCount2(content),
        isReact: extension === ".tsx" || extension === ".jsx"
      });
    }
  };
  walk(cwd);
  return results;
}

// src/doctor/findings.ts
function analysisFindings(cwd, packageInfo, config, workflowState, analysis) {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file2) => SOURCE_EXTENSIONS2.has(file2.extension));
  const reactFiles = sourceFiles.filter((file2) => file2.isReact);
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
function memoryFindings(cwd, missingFiles, workflowState) {
  const findings = [];
  if (!fs7.existsSync(path8.join(cwd, ".agentkick.json"))) {
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
  for (const file2 of missingFiles) {
    findings.push(
      finding({
        id: `memory.missing.${slug(file2)}`,
        priority: file2 === "AGENTS.md" || file2 === "WORKFLOW_RULES.md" || file2 === ".agentkick.json" ? "P0" : "P1",
        category: file2 === "CURRENT_TASK.md" ? "continuity" : "memory",
        title: `Missing workflow memory: ${file2}`,
        file: file2,
        signal: `${file2} was not found at the repo root.`,
        agentImpact: file2 === "CURRENT_TASK.md" ? "Task continuity breaks after a chat reset because active scope has no durable home." : "Agents must infer repo rules from chat history or source files.",
        recommendation: "Run agentkick init or add the missing file with concise agent-readable sections.",
        autoFix: "safe-plan"
      })
    );
  }
  for (const file2 of WORKFLOW_MEMORY_FILES) {
    const fullPath = path8.join(cwd, file2);
    if (!fs7.existsSync(fullPath)) continue;
    const content = readFileSafe2(fullPath);
    const lines = lineCount2(content);
    if (content.trim().length < 80) {
      findings.push(
        finding({
          id: `memory.thin.${slug(file2)}`,
          priority: "P2",
          category: "memory",
          title: `Thin workflow memory: ${file2}`,
          file: file2,
          signal: `${file2} has less than 80 characters of usable content.`,
          agentImpact: "Agents get the file name but not enough rules, scope, or continuity to act reliably.",
          recommendation: "Add purpose, boundaries, commands, update rules, and current risks in short sections.",
          autoFix: "manual"
        })
      );
    }
    if (lines >= 350 || content.length >= 3e4) {
      findings.push(
        finding({
          id: `memory.oversized.${slug(file2)}`,
          priority: "P2",
          category: "token-waste",
          title: `Oversized workflow memory: ${file2}`,
          file: file2,
          signal: `${file2} has ${lines} lines and ${content.length} characters.`,
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
function verificationFindings(packageInfo, config) {
  const findings = [];
  const scripts = packageInfo?.scripts ?? {};
  const configTest = config?.testCommand;
  const configBuild = config?.buildCommand;
  const hasTest = Boolean(scripts.test || configTest && !configTest.startsWith("document "));
  const hasBuild = Boolean(scripts.build || configBuild && !configBuild.startsWith("document "));
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
function generatedVendorFindings(cwd, paths) {
  if (paths.length === 0) return [];
  const guidance = `${readFileSafe2(path8.join(cwd, "WORKFLOW_RULES.md"))}
${readFileSafe2(path8.join(cwd, "AGENTS.md"))}`;
  const lowerGuidance = guidance.toLowerCase();
  return paths.filter((item) => !pathCoveredByGuidance(item, lowerGuidance)).slice(0, 8).map(
    (item) => finding({
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
function sourceFileFindings(files) {
  return files.filter((file2) => file2.lines >= 700 || file2.bytes >= 6e4).slice(0, 12).map(
    (file2) => finding({
      id: `context.giant-file.${slug(file2.relativePath)}`,
      priority: file2.lines >= 1200 || file2.bytes >= 12e4 ? "P1" : "P2",
      category: "context-waste",
      title: "Oversized source file",
      file: file2.relativePath,
      signal: `${file2.lines} lines, ${file2.bytes} bytes.`,
      agentImpact: "Agents will load unrelated behavior to make a small scoped change.",
      recommendation: "Split stable helpers, UI sections, and business logic into feature-scoped modules.",
      autoFix: "manual"
    })
  );
}
function reactFindings(files) {
  const findings = [];
  for (const file2 of files) {
    const content = readFileSafe2(file2.absolutePath);
    const hookCount = (content.match(/\buse[A-Z]\w*\(/g) ?? []).length;
    const jsxBlocks = (content.match(/return\s*\(/g) ?? []).length;
    if (file2.lines >= 320 || hookCount >= 9 || jsxBlocks >= 6) {
      findings.push(
        finding({
          id: `context.oversized-react.${slug(file2.relativePath)}`,
          priority: file2.lines >= 600 || hookCount >= 14 ? "P1" : "P2",
          category: "context-waste",
          title: "Oversized React component",
          file: file2.relativePath,
          signal: `${file2.lines} lines, ${hookCount} hook calls, ${jsxBlocks} JSX return blocks.`,
          agentImpact: "Small UI changes require loading unrelated state, effects, and view logic.",
          recommendation: "Extract feature sections, hooks, data adapters, and presentational components.",
          autoFix: "manual"
        })
      );
    }
  }
  return findings.slice(0, 12);
}
function modularityFindings(cwd, sourceFiles) {
  const findings = [];
  const srcFiles = sourceFiles.filter((file2) => file2.relativePath.startsWith("src/"));
  const topLevelSrcFiles = srcFiles.filter((file2) => file2.relativePath.split("/").length <= 2);
  const hasFeatureBoundary = directoryExists3(cwd, "src/features") || directoryExists3(cwd, "features") || directoryExists3(cwd, "src/commands") && directoryExists3(cwd, "src/core") && directoryExists3(cwd, "src/workflow");
  const hasCoreBoundary = directoryExists3(cwd, "src/core") || directoryExists3(cwd, "core");
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
function taskStateFindings(cwd, workflowState) {
  const findings = [];
  const currentTaskPath = path8.join(cwd, "CURRENT_TASK.md");
  if (!fs7.existsSync(currentTaskPath)) return findings;
  const currentTask = readFileSafe2(currentTaskPath);
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
    const days = ageMs / 864e5;
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
          recommendation: "Run agentkick summarize, clear the active task, or run agentkick focus <scope> for current work.",
          autoFix: "manual"
        })
      );
    }
  }
  return findings;
}
function ciFindings(cwd) {
  if (fs7.existsSync(path8.join(cwd, ".github", "workflows"))) return [];
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
function suggestionsFor(findings) {
  return [...new Set(findings.map((finding2) => finding2.recommendation))].slice(0, 10);
}
function findingMessage(finding2) {
  return `${finding2.priority} ${finding2.title}${finding2.file ? ` (${finding2.file})` : ""}: ${finding2.signal}`;
}
function nextCommandFor(findings) {
  if (findings.some(
    (finding2) => finding2.priority === "P0" && (finding2.category === "memory" || finding2.category === "continuity")
  )) {
    return "agentkick init --dry-run";
  }
  if (findings.some((finding2) => finding2.category === "context-waste")) return "agentkick split-task <task>";
  return "agentkick focus <scope>";
}
function finding(input2) {
  return input2;
}
function compareFindings(a, b) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return order[a.priority] - order[b.priority] || a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
}

// src/doctor/report.ts
function printAudit(audit, options) {
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
function printFindingBlock(title, findings) {
  console.log(section(title));
  if (findings.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const finding2 of findings) {
    const file2 = finding2.file && !finding2.title.includes(finding2.file) ? ` ${pathLabel(finding2.file)}` : "";
    console.log(bullet(`${finding2.priority} ${finding2.category}: ${finding2.title}${file2}`));
    console.log(`  ${keyValue("Signal", finding2.signal)}`);
    console.log(`  ${keyValue("Agent impact", finding2.agentImpact)}`);
    console.log(`  ${keyValue("Fix", finding2.recommendation)}`);
  }
  console.log("");
}
function printMissingMemory(audit) {
  console.log(section("Missing memory/workflow files:"));
  if (audit.missingMemoryFiles.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const item of audit.missingMemoryFiles) console.log(bullet(item));
  console.log("");
}
function jsonAudit(audit) {
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
function printDetectionDebug(detection) {
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
function printWorkflowDebug(analysis) {
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
  for (const file2 of analysis.largestFiles) {
    console.log(bullet(`${pathLabel(file2.relativePath)} (${file2.lines} lines, ${file2.bytes} bytes)`));
  }
}
function printWorkspaceHints(detection) {
  if (detection.workspaceHints.length === 0) return;
  console.log("");
  console.log(section("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint2 of detection.workspaceHints.slice(0, 5)) {
    console.log(`  ${command(`cd ${hint2.path}`)}  # ${hint2.stack}`);
  }
}
function printList(items) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(bullet(item));
}

// src/doctor/doctor-engine.ts
function runDoctor(cwd, options = {}) {
  const audit = auditRepo(cwd);
  if (options.json) {
    console.log(JSON.stringify(jsonAudit(audit), null, 2));
  } else {
    printAudit(audit, options);
  }
  if (options.strict && (audit.findings.some((finding2) => finding2.priority === "P0") || audit.score < 85)) {
    process.exitCode = 1;
  }
}
function auditRepo(cwd) {
  const packageInfo = readJsonSafe(path9.join(cwd, "package.json"));
  const config = readJsonSafe(path9.join(cwd, ".agentkick.json"));
  const workflowState = readJsonSafe(path9.join(cwd, ".agentkick", "workflow-state.json"));
  const profile = detectProject(cwd);
  const checks = [
    ...REQUIRED_AGENT_FILES.map(([file2, label]) => requiredFile(cwd, file2, label)),
    ...OPTIONAL_AGENT_FILES.map(([file2, label]) => optionalFile(cwd, file2, label))
  ];
  const verificationCommand3 = commandFor(profile.testCommand, "test", packageInfo?.scripts?.test);
  const buildCommand2 = commandFor(profile.buildCommand, "build", packageInfo?.scripts?.build);
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
    verificationCommand: verificationCommand3,
    buildCommand: buildCommand2,
    nextCommand: nextCommandFor(findings),
    findings,
    generatedVendorPaths: analysis.generatedVendorPaths,
    missingMemoryFiles: analysis.missingMemoryFiles,
    checks,
    warnings: findings.filter((finding2) => finding2.priority !== "P0").map(findingMessage),
    failures: [...failures, ...findings.filter((finding2) => finding2.priority === "P0").map(findingMessage)],
    suggestions: suggestionsFor(findings),
    detectionDebug: profile.detection ?? fallbackDetection(cwd, profile.primaryStack ?? profile.template, profile.stack),
    analysis
  };
}
function analyzeWorkflow(cwd, packageInfo, config, workflowState) {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file2) => SOURCE_EXTENSIONS2.has(file2.extension));
  const reactFiles = sourceFiles.filter((file2) => file2.isReact);
  const generatedVendorPaths = GENERATED_VENDOR_CANDIDATES.filter((candidate) => directoryExists3(cwd, candidate));
  const missingMemoryFiles = WORKFLOW_MEMORY_FILES.filter(
    (file2) => !directoryExists3(cwd, file2) && !pathExists(cwd, file2)
  );
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
    contextWasteZones: preliminary.filter(
      (finding2) => ["context-waste", "token-waste", "file-size", "react-component"].includes(finding2.category)
    )
  };
}
function readinessScore(findings) {
  const weights = { P0: 22, P1: 12, P2: 6, P3: 2 };
  const penalty = findings.reduce((total, finding2) => total + weights[finding2.priority], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
function statusFor(scoreValue, findings) {
  if (findings.some((finding2) => finding2.priority === "P0")) return "blocked";
  if (scoreValue >= 85) return "ready";
  return "needs-review";
}
function pathExists(cwd, relativePath) {
  try {
    return fs8.existsSync(path9.join(cwd, relativePath));
  } catch {
    return false;
  }
}

// src/commands/doctor.ts
function registerDoctorCommand(program, context) {
  program.command("doctor").description("Analyze repo readiness for AI-assisted development.").option("--strict", "exit non-zero when readiness is blocked or below threshold").option("--json", "print JSON output").option("--debug", "print stack detection reasoning").addHelpText(
    "after",
    `

Examples:
  $ agentkick doctor
  $ agentkick doctor --debug
  $ agentkick doctor --strict
`
  ).action((options) => {
    runDoctor(context.cwd, options);
  });
}

// src/commands/focus.ts
function registerFocusCommand(program, context) {
  program.command("focus").description("Generate scoped task context and update workflow state.").argument("[scope]", "optional feature, folder, or task scope").option("--files <paths...>", "explicit task files or folders to use as scope").option("--feature <name>", "feature name to focus").option("--task <task>", "task description to turn into an agent brief").addHelpText(
    "after",
    `

Examples:
  $ agentkick focus auth
  $ agentkick focus --feature billing
  $ agentkick focus --task "Improve README positioning"
  $ agentkick focus --files README.md package.json
  $ agentkick focus checkout
  $ agentkick focus "fix popup button"
`
  ).action((scope, options) => {
    applyWriteMode(program, options);
    console.log(
      renderFocus(
        buildFocusContext(context.cwd, {
          scope,
          files: options.files,
          feature: options.feature,
          task: options.task
        })
      )
    );
  });
}

// src/utils/format.ts
import chalk3 from "chalk";
function formatStack(profile) {
  return profile.primaryStack ?? profile.template ?? "generic";
}
function printDetectionSummary(profile) {
  console.log(`Detected stack: ${chalk3.bold(formatStack(profile))}`);
  if (profile.capabilities?.length) {
    console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  }
  if (formatStack(profile) === "generic") {
    console.log(chalk3.yellow("Could not confidently detect stack. Run agentkick doctor --debug to see checked files."));
    printWorkspaceHints2(profile.detection?.workspaceHints ?? []);
  }
}
function printWorkspaceHints2(hints) {
  if (hints.length === 0) return;
  console.log("");
  console.log(chalk3.yellow("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint2 of hints.slice(0, 5)) {
    console.log(`  ${chalk3.cyan(`cd ${hint2.path}`)}  ${chalk3.gray(`# ${hint2.stack}`)}`);
  }
}

// src/commands/init.ts
function registerInitCommand(program, context) {
  program.command("init").description("Initialize workflow memory and agent instructions in the current repo.").option("--dry-run", "show file operations without writing").addHelpText(
    "after",
    `

Examples:
  $ agentkick init
  $ agentkick init --dry-run
`
  ).action((options) => {
    applyWriteMode(program, options);
    const profile = detectProject(context.cwd);
    const spinner = isDryRun(program, options) ? null : createSpinner("Writing workflow memory").start();
    try {
      writeAgentFiles(context.cwd, profile);
      writeInitialWorkflowState(context.cwd, profile);
      writePack(context.cwd, "core", profile);
      spinner?.succeed("Workflow memory written");
    } catch (error) {
      spinner?.fail("Initialization failed");
      throw error;
    }
    console.log(header("AgentKick initialized", "Workflow memory is now repo-native."));
    console.log("");
    logger.success(`initialized ${profile.name}`);
    console.log(keyValue("Project", profile.name));
    console.log(keyValue("Package manager", profile.packageManager));
    if (options.dryRun) logger.muted("Dry run only. No files were written.");
    printDetectionSummary(profile);
    console.log("");
    console.log(nextSteps(["agentkick doctor", "agentkick focus <scope>", "agentkick summarize"]));
  });
}

// src/commands/new.ts
import fs9 from "fs";
import path10 from "path";
import { input, select } from "@inquirer/prompts";
import { z } from "zod";

// src/templates/chrome-extension-template.ts
function chromeExtensionFiles(profile) {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        type: "module",
        scripts: {
          check: "node --check src/background/index.js && node --check src/content/index.js && node --check src/popup/index.js && node --check src/shared/messages.js",
          package: "node scripts/package-extension.js",
          test: "npm run check",
          build: "npm run package"
        },
        devDependencies: {}
      })
    },
    {
      path: "manifest.json",
      content: json({
        manifest_version: 3,
        name: "{{projectTitle}}",
        version: "0.1.0",
        description: "AI-native Chrome extension generated by AgentKick.",
        action: { default_popup: "src/popup/index.html" },
        background: { service_worker: "src/background/index.js", type: "module" },
        content_scripts: [{ matches: ["<all_urls>"], js: ["src/content/index.js"], run_at: "document_idle" }],
        permissions: ["storage"]
      })
    },
    {
      path: "src/background/index.js",
      content: `import { MESSAGE_TYPES } from "../shared/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ installedAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== MESSAGE_TYPES.PING) return false;
  sendResponse({ ok: true, scope: "background" });
  return true;
});
`
    },
    {
      path: "src/content/index.js",
      content: `const MESSAGE_TYPE = "agentkick:ping";

chrome.runtime.sendMessage({ type: MESSAGE_TYPE, source: "content" }).catch(() => {
  // The background worker may be unavailable on restricted pages.
});
`
    },
    {
      path: "src/shared/messages.js",
      content: `export const MESSAGE_TYPES = Object.freeze({
  PING: "agentkick:ping"
});
`
    },
    {
      path: "src/popup/index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./styles.css">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <main>
      <section class="panel">
        <p class="eyebrow">Extension</p>
        <h1>{{projectTitle}}</h1>
        <p id="status">Ready</p>
        <button id="check" type="button">Check worker</button>
      </section>
    </main>
    <script type="module" src="./index.js"></script>
  </body>
</html>
`
    },
    {
      path: "src/popup/index.js",
      content: `import { MESSAGE_TYPES } from "../shared/messages.js";

const button = document.querySelector("#check");
const status = document.querySelector("#status");

button?.addEventListener("click", async () => {
  status.textContent = "Checking...";
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.PING, source: "popup" });
    status.textContent = response?.ok ? "Background worker ready." : "No response.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Unable to reach background worker.";
  }
});
`
    },
    {
      path: "src/popup/styles.css",
      content: `:root {
  color-scheme: light;
  --bg: #f7f8fb;
  --ink: #101827;
  --muted: #5d6678;
  --line: #d6deea;
  --accent: #1f5eff;
}

body {
  margin: 0;
  width: 360px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

main {
  padding: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 16px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: 20px;
}

button {
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
}
`
    },
    {
      path: "scripts/package-extension.js",
      content: `import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync("manifest.json", path.join(dist, "manifest.json"));
fs.cpSync("src", path.join(dist, "src"), { recursive: true });
console.log("Extension package prepared in dist/");
`
    },
    {
      path: "src/features/README.md",
      content: `# Extension Features

Keep feature code grouped by browser surface:

- \`background\`: service worker and durable browser events
- \`content\`: page interaction layer
- \`popup\`: user interface
- \`shared\`: message contracts and stable utilities
`
    }
  ];
}

// src/templates/desktop-templates.ts
function electronAppFiles(profile) {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        main: "dist/main/index.js",
        scripts: {
          dev: "electron-vite dev",
          build: "tsc --noEmit && electron-vite build",
          package: "npm run build && electron-builder --dir",
          test: "npm run build"
        },
        dependencies: {
          electron: "^39.2.7",
          "electron-vite": "^5.0.0",
          react: "^19.2.3",
          "react-dom": "^19.2.3"
        },
        devDependencies: {
          "@types/node": "latest",
          "@types/react": "^19.2.7",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^5.1.2",
          "electron-builder": "^26.0.12",
          typescript: "^5.9.3",
          vite: "^7.3.0"
        },
        build: {
          appId: `com.agentkick.${profile.name.replace(/[^a-z0-9]/g, "") || "desktop"}`,
          productName: "{{projectTitle}}",
          directories: { output: "release" },
          files: ["dist/**"]
        }
      })
    },
    {
      path: "electron.vite.config.ts",
      content: `import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts")
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts")
        }
      }
    }
  },
  renderer: {
    root: "src/renderer",
    plugins: [react()]
  }
});
`
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2022",
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          isolatedModules: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["node"]
        },
        include: ["electron.vite.config.ts", "src/**/*.ts", "src/**/*.tsx"]
      })
    },
    {
      path: "src/main/index.ts",
      content: `import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 560,
    title: "{{projectTitle}}",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("app:version", () => app.getVersion());

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`
    },
    {
      path: "src/preload/index.ts",
      content: `import { contextBridge, ipcRenderer } from "electron";

const desktop = {
  getVersion: () => ipcRenderer.invoke("app:version") as Promise<string>
};

contextBridge.exposeInMainWorld("desktop", desktop);

export type DesktopBridge = typeof desktop;
`
    },
    {
      path: "src/renderer/src/vite-env.d.ts",
      content: `/// <reference types="vite/client" />

import type { DesktopBridge } from "../../preload";

declare global {
  interface Window {
    desktop: DesktopBridge;
  }
}
`
    },
    {
      path: "src/renderer/index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/App.tsx"></script>
  </body>
</html>
`
    },
    {
      path: "src/renderer/src/App.tsx",
      content: `import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [version, setVersion] = useState("loading");

  useEffect(() => {
    void window.desktop.getVersion().then(setVersion);
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Electron Desktop</p>
        <h1>{{projectTitle}}</h1>
        <p>Build desktop workflows with strict main, preload, and renderer boundaries.</p>
      </section>
      <section className="panel" aria-label="Desktop status">
        <span>App version</span>
        <strong>{version}</strong>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
`
    },
    {
      path: "src/renderer/src/styles.css",
      content: desktopStyles("Electron")
    },
    {
      path: "src/features/desktop-shell/README.md",
      content: `# Desktop Shell

Owns the desktop window, IPC bridge, and renderer shell.

Agent rules:

- Keep Electron main-process code in \`src/main\`.
- Keep preload bridge code in \`src/preload\`.
- Keep UI code in \`src/renderer\`.
- Add IPC channels intentionally and document why renderer code needs each one.
`
    }
  ];
}
function tauriAppFiles(profile) {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "tauri dev",
          "web:dev": "vite --host 127.0.0.1 --port 1420",
          "web:build": "npm run typecheck && vite build",
          build: "tauri build",
          typecheck: "tsc --noEmit",
          test: "npm run typecheck"
        },
        dependencies: {
          "@tauri-apps/api": "latest",
          react: "^19.2.3",
          "react-dom": "^19.2.3"
        },
        devDependencies: {
          "@tauri-apps/cli": "latest",
          "@types/node": "latest",
          "@types/react": "^19.2.7",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^5.1.2",
          typescript: "^5.9.3",
          vite: "^7.3.0"
        }
      })
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    strictPort: true
  },
  envPrefix: ["VITE_", "TAURI_"]
});
`
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: "ESNext",
          moduleResolution: "Node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx"
        },
        include: ["src"],
        references: []
      })
    },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
`
    },
    {
      path: "src/app/main.tsx",
      content: `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: "src/app/App.tsx",
      content: `import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function App() {
  const [message, setMessage] = useState("Ready");

  async function checkNativeBridge() {
    const response = await invoke<string>("desktop_status", { name: "{{projectTitle}}" });
    setMessage(response);
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Tauri Desktop</p>
        <h1>{{projectTitle}}</h1>
        <p>Build native desktop workflows with narrow Rust commands and minimal permissions.</p>
      </section>
      <section className="panel" aria-label="Native bridge status">
        <span>Native bridge</span>
        <strong>{message}</strong>
        <button type="button" onClick={checkNativeBridge}>
          Check bridge
        </button>
      </section>
    </main>
  );
}
`
    },
    {
      path: "src/app/styles.css",
      content: desktopStyles("Tauri")
    },
    {
      path: "src/features/desktop-shell/README.md",
      content: `# Desktop Shell

Owns the Tauri window, native command bridge, and renderer shell.

Agent rules:

- Keep native commands narrow and typed in \`src-tauri/src\`.
- Keep UI behavior in \`src/app\` or feature folders.
- Keep capabilities minimal and review permission changes carefully.
- Do not add broad filesystem, shell, or network permissions without documenting the user-facing need.
`
    },
    {
      path: "src/core/native.ts",
      content: `import { invoke } from "@tauri-apps/api/core";

export function desktopStatus(name: string) {
  return invoke<string>("desktop_status", { name });
}
`
    },
    {
      path: "src-tauri/Cargo.toml",
      content: `[package]
name = "{{projectName}}"
version = "0.1.0"
description = "Desktop app generated by AgentKick"
authors = ["you"]
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`
    },
    {
      path: "src-tauri/build.rs",
      content: `fn main() {
  tauri_build::build()
}
`
    },
    {
      path: "src-tauri/tauri.conf.json",
      content: json({
        $schema: "https://schema.tauri.app/config/2",
        productName: "{{projectTitle}}",
        version: "0.1.0",
        identifier: `com.agentkick.${profile.name.replace(/[^a-z0-9]/g, "") || "desktop"}`,
        build: {
          beforeDevCommand: "npm run web:dev",
          beforeBuildCommand: "npm run web:build",
          devUrl: "http://127.0.0.1:1420",
          frontendDist: "../dist"
        },
        app: {
          windows: [
            {
              title: "{{projectTitle}}",
              width: 1120,
              height: 760,
              minWidth: 860,
              minHeight: 560
            }
          ],
          security: {
            csp: null
          }
        },
        bundle: {
          active: true,
          targets: "all"
        }
      })
    },
    {
      path: "src-tauri/src/main.rs",
      content: `#[tauri::command]
fn desktop_status(name: &str) -> String {
    format!("{name} native bridge ready")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
`
    },
    {
      path: "src-tauri/capabilities/default.json",
      content: json({
        identifier: "default",
        description: "Default desktop capability with no broad filesystem or shell permissions.",
        windows: ["main"],
        permissions: ["core:default"]
      })
    }
  ];
}
function desktopStyles(stackName) {
  return `:root {
  color-scheme: light;
  --bg: #f5f7fb;
  --ink: #101827;
  --muted: #5c6678;
  --line: #d8e0eb;
  --accent: #1f5eff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 760px;
  min-height: 520px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  min-height: 100vh;
  width: min(1040px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  align-content: center;
  gap: 24px;
}

.hero {
  display: grid;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0;
  font-size: 56px;
  line-height: 1;
}

p {
  max-width: 660px;
  margin: 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.6;
}

.panel {
  width: min(480px, 100%);
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 18px;
}

.panel span {
  color: var(--muted);
  font-size: 13px;
}

.panel strong {
  font-size: 18px;
}

button {
  width: fit-content;
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 820px) {
  body {
    min-width: 0;
  }

  .shell {
    width: min(100% - 32px, 1040px);
  }

  h1 {
    font-size: 40px;
  }
}

/* ${stackName} template: keep native bridge code outside the UI surface. */
`;
}

// src/templates/internal-tool-template.ts
function internalToolFiles(profile) {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "tsc --noEmit && vite build", preview: "vite preview", test: "npm run build" },
        dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest" },
        devDependencies: {
          typescript: "latest",
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest"
        }
      })
    },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
`
    },
    {
      path: "src/app/main.tsx",
      content: `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: "src/app/App.tsx",
      content: `import { WorkflowQueue } from "../features/workflows/WorkflowQueue";

export function App() {
  return (
    <main className="shell">
      <section>
        <p className="eyebrow">Internal Tool</p>
        <h1>{{projectTitle}}</h1>
        <p>Operate repeatable workflows with clear ownership and agent-readable task boundaries.</p>
      </section>
      <WorkflowQueue />
    </main>
  );
}
`
    },
    {
      path: "src/app/styles.css",
      content: `:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --ink: #101827;
  --muted: #5c6678;
  --line: #d9e0ea;
  --accent: #0f766e;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  width: min(1040px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0;
  display: grid;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(34px, 6vw, 64px);
  line-height: 1;
}

.queue {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 20px;
}
`
    },
    {
      path: "src/features/workflows/WorkflowQueue.tsx",
      content: `const tasks = [
  { id: "ops-review", title: "Review blocked workflows", owner: "operations" },
  { id: "customer-sync", title: "Sync customer updates", owner: "support" }
];

export function WorkflowQueue() {
  return (
    <section className="queue" aria-label="Workflow queue">
      <h2>Workflow queue</h2>
      {tasks.map((task) => (
        <article key={task.id}>
          <strong>{task.title}</strong>
          <p>Owner: {task.owner}</p>
        </article>
      ))}
    </section>
  );
}
`
    },
    {
      path: "src/core/api-client.ts",
      content: `export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json() as Promise<T>;
}
`
    },
    {
      path: "src/features/reports/README.md",
      content: `# Reports

Owns operational reporting, exports, and dashboard metrics.
`
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: "ESNext",
          moduleResolution: "Node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx"
        },
        include: ["src"],
        references: []
      })
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
`
    }
  ];
}

// src/templates/next-templates.ts
function aiSaasFiles(profile) {
  return [
    ...nextPackageFiles(profile, "AI SaaS application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the AI workflow layer first.",
      "Design workflows that agents can understand and users can trust."
    ),
    {
      path: "app/api/workflows/route.ts",
      content: `import { NextResponse } from "next/server";
import { listWorkflowRuns } from "@/src/features/workflows/server/workflow-service";

export async function GET() {
  return NextResponse.json({ workflows: listWorkflowRuns() });
}
`
    },
    {
      path: "src/features/workflows/server/workflow-service.ts",
      content: `export type WorkflowRun = {
  id: string;
  name: string;
  status: "queued" | "running" | "complete";
};

const runs: WorkflowRun[] = [
  { id: "demo-onboarding", name: "Onboarding analysis", status: "queued" }
];

export function listWorkflowRuns() {
  return runs;
}
`
    },
    {
      path: "src/features/workflows/README.md",
      content: `# Workflows

Owns AI workflow runs, execution state, and task handoff boundaries.

Agents should keep prompt, execution, and result handling separate in this feature.
`
    },
    {
      path: "src/features/memory/README.md",
      content: `# Memory

Owns durable project and customer-facing memory. Do not store secrets here.

Use small typed records and summarize long-running state before it enters prompts.
`
    },
    {
      path: "src/core/env.ts",
      content: `export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing required environment variable: \${name}\`);
  return value;
}
`
    }
  ];
}
function saasFiles(profile) {
  return [
    ...nextPackageFiles(profile, "SaaS application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the smallest useful customer workspace.",
      "Keep account, billing, and workspace boundaries explicit."
    ),
    {
      path: "src/features/accounts/README.md",
      content: `# Accounts

Owns user, organization, and membership behavior.

Do not mix billing or product workflow behavior into this module.
`
    },
    {
      path: "src/features/billing/README.md",
      content: `# Billing

Owns plans, subscriptions, invoices, and payment-provider boundaries.

Agents must call out migration impact before changing billing contracts.
`
    },
    {
      path: "src/features/workspaces/README.md",
      content: `# Workspaces

Owns the customer workspace shell and scoped project data.
`
    },
    {
      path: "app/api/health/route.ts",
      content: `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "{{projectName}}" });
}
`
    }
  ];
}
function marketplaceFiles(profile) {
  return [
    ...nextPackageFiles(profile, "Marketplace application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the marketplace trust loop first.",
      "Keep vendor, listing, order, and admin modules isolated."
    ),
    {
      path: "src/features/vendors/README.md",
      content: `# Vendors

Owns seller onboarding, profiles, approval state, and vendor operations.
`
    },
    {
      path: "src/features/listings/README.md",
      content: `# Listings

Owns catalog items, availability, pricing display, and listing quality checks.
`
    },
    {
      path: "src/features/orders/README.md",
      content: `# Orders

Owns checkout handoff, order lifecycle, fulfillment state, and customer updates.
`
    },
    {
      path: "src/features/admin/README.md",
      content: `# Admin

Owns marketplace moderation, trust operations, and support workflows.
`
    },
    {
      path: "app/api/marketplace/route.ts",
      content: `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    vendors: [],
    listings: [],
    orders: []
  });
}
`
    }
  ];
}
function nextPackageFiles(profile, description) {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        description,
        scripts: { dev: "next dev", build: "next build", start: "next start", test: "npm run build" },
        dependencies: { next: "latest", react: "latest", "react-dom": "latest" },
        devDependencies: {
          typescript: "latest",
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest"
        }
      })
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          paths: { "@/*": ["./*"] }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      })
    },
    { path: "next.config.mjs", content: "const nextConfig = {};\nexport default nextConfig;\n" }
  ];
}
function nextBaseFiles(headline, subheadline) {
  return [
    {
      path: "app/layout.tsx",
      content: `import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
    },
    {
      path: "app/page.tsx",
      content: `export default function Home() {
  return (
    <main className="shell">
      <section>
        <p className="eyebrow">AgentKick Project</p>
        <h1>${headline}</h1>
        <p>${subheadline}</p>
      </section>
    </main>
  );
}
`
    },
    {
      path: "app/globals.css",
      content: `:root {
  color-scheme: light;
  --bg: #f7f8fb;
  --ink: #111827;
  --muted: #5d6678;
  --accent: #1f5eff;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  min-height: 100vh;
  width: min(960px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  align-content: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0 0 18px;
  font-size: clamp(40px, 8vw, 84px);
  line-height: 0.98;
}

p {
  max-width: 680px;
  font-size: 20px;
  line-height: 1.6;
}
`
    },
    {
      path: "src/core/README.md",
      content: `# Core

Shared framework-neutral code lives here. Keep this folder small and stable.
`
    },
    {
      path: "src/shared/README.md",
      content: `# Shared

Reusable utilities and presentational pieces that do not own product behavior.
`
    }
  ];
}

// src/templates/shared-template-files.ts
function sharedMemoryFiles(profile, template) {
  return [
    {
      path: "CURRENT_TASK.md",
      content: `# Current Task

## Status

No active task.

## Active Scope

- Template: {{templateLabel}}
- Project: {{projectTitle}}
- Primary stack: ${profile.stack.join(", ")}

## Next Execution

- Run \`${profile.testCommand}\` before handing work back.
- Keep task notes short and move completed work into \`TASK_HISTORY.md\`.
- Start each new agent session by reading \`AGENTS.md\`, \`CURRENT_TASK.md\`, and \`ARCHITECTURE.md\`.
`
    },
    {
      path: "ARCHITECTURE.md",
      content: `# Architecture

## System Shape

{{projectTitle}} is a {{templateLabel}} project generated for AI-assisted development.

## Boundaries

- \`src/core\`: shared primitives, configuration, and framework-neutral helpers.
- \`src/features\`: feature modules with local UI, workflow, and service code.
- \`src/app\` or \`app\`: route and composition layer.
- \`src/shared\`: small reusable utilities that are stable across features.
- \`docs\`: product, workflow, and launch notes.

## Agent Rules

- Edit inside one feature boundary when possible.
- Move reusable behavior to \`src/core\` only after two real call sites exist.
- Keep route handlers thin and push business behavior into feature modules.
- Do not add cross-feature imports without documenting the dependency here.
`
    },
    {
      path: "WORKFLOW_RULES.md",
      content: `# Workflow Rules

## Context Loading

1. Read \`AGENTS.md\`.
2. Read \`CURRENT_TASK.md\`.
3. Read the feature README for the scoped module.
4. Open only the files required for the task.

## Update Rules

- Update \`CURRENT_TASK.md\` when task scope changes.
- Add durable decisions to \`DECISIONS.md\`.
- Add completed task notes to \`TASK_HISTORY.md\`.
- Keep generated memory concise. Prefer bullets over long prose.

## Execution Discipline

- One task, one feature scope, one verification command.
- Avoid broad rewrites during focused fixes.
- Do not mix product, auth, billing, and database changes in the same task unless explicitly requested.
`
    },
    {
      path: "FEATURE_SUMMARIES.md",
      content: `# Feature Summaries

Keep one short section per feature. Each section should explain ownership, important files, and current risks.

## Template Features

- Project type: {{templateLabel}}
- Source boundaries are documented in \`ARCHITECTURE.md\`.
- Add feature entries when implementation begins.
`
    },
    {
      path: "DECISIONS.md",
      content: `# Decisions

Record durable technical and product decisions here. Keep entries short enough for agents to scan.

## Format

- Date:
- Decision:
- Context:
- Consequences:
`
    },
    {
      path: "TASK_HISTORY.md",
      content: `# Task History

Record completed work here after it is verified.

## Entries

- No completed tasks yet.
`
    },
    {
      path: "docs/PROJECT_MAP.md",
      content: `# Project Map

## Template

- Type: {{templateLabel}}
- Description: ${template.description}

## First Files To Read

- \`AGENTS.md\`
- \`CURRENT_TASK.md\`
- \`ARCHITECTURE.md\`
- \`WORKFLOW_RULES.md\`
`
    }
  ];
}
function gitignoreFor(profile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/", "*.agentkick-backup"];
  const stackItems = ["node_modules/"];
  if (profile.stack.includes("nextjs")) stackItems.push(".next/", "out/");
  if (profile.stack.includes("vite")) stackItems.push(".vite/");
  if (profile.stack.includes("electron")) stackItems.push("release/");
  if (profile.stack.includes("tauri")) stackItems.push("src-tauri/target/");
  return `${[.../* @__PURE__ */ new Set([...common, ...stackItems])].join("\n")}
`;
}
function variablesFor(profile, template) {
  return {
    projectName: profile.name,
    projectTitle: titleize2(profile.name),
    template: template.id,
    templateLabel: template.label
  };
}
function render(content, variables) {
  return content.replace(/\{\{(\w+)}}/g, (_match, key) => variables[key] ?? "");
}
function titleize2(value) {
  return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

// src/templates/project-templates.ts
var TEMPLATE_REGISTRY = {
  "ai-saas": {
    id: "ai-saas",
    label: "AI SaaS",
    description: "Next.js product shell with AI workflow boundaries.",
    defaultPacks: ["core", "github"],
    files: aiSaasFiles
  },
  "chrome-extension": {
    id: "chrome-extension",
    label: "Chrome Extension",
    description: "Manifest V3 extension with popup, content, and background boundaries.",
    defaultPacks: ["core", "chrome-extension", "github"],
    files: chromeExtensionFiles
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Buyer/seller marketplace starter with scoped domains.",
    defaultPacks: ["core", "github"],
    files: marketplaceFiles
  },
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Clean SaaS app shell with product, billing, and dashboard zones.",
    defaultPacks: ["core", "github"],
    files: saasFiles
  },
  "internal-tool": {
    id: "internal-tool",
    label: "Internal Tool",
    description: "Operational dashboard template with workflow-first boundaries.",
    defaultPacks: ["core", "github"],
    files: internalToolFiles
  },
  "electron-app": {
    id: "electron-app",
    label: "Electron App",
    description: "Electron + React + Vite desktop app with secure process boundaries.",
    defaultPacks: ["core", "electron", "github"],
    files: electronAppFiles
  },
  "tauri-app": {
    id: "tauri-app",
    label: "Tauri App",
    description: "Tauri + React + Vite native desktop app with explicit command bridge.",
    defaultPacks: ["core", "tauri", "github"],
    files: tauriAppFiles
  }
};
function getTemplateDefinition(template) {
  return TEMPLATE_REGISTRY[template];
}
function templateChoices() {
  return Object.values(TEMPLATE_REGISTRY).map((template) => ({
    name: template.label,
    value: template.id,
    description: template.description
  }));
}
async function writeTemplateProject(projectDir, profile) {
  const definition = getTemplateDefinition(profile.template);
  const variables = variablesFor(profile, definition);
  const templateFiles = [
    ...definition.files(profile),
    ...sharedMemoryFiles(profile, definition),
    { path: "README.md", content: readmeFor(profile) },
    { path: ".gitignore", content: gitignoreFor(profile) },
    {
      path: ".agentkick.json",
      content: JSON.stringify(
        {
          project: profile.name,
          template: profile.template,
          stack: profile.stack,
          packageManager: profile.packageManager,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          workflowPacks: definition.defaultPacks
        },
        null,
        2
      )
    }
  ];
  for (const file2 of templateFiles) {
    await writeFile(projectDir, file2.path, render(file2.content, variables));
  }
  return {
    files: templateFiles.map((file2) => file2.path).sort(),
    packs: definition.defaultPacks
  };
}
function postInstallStepsFor(template) {
  if (template === "tauri-app") {
    return [
      "Install Rust and Tauri system prerequisites before running npm run dev.",
      "Run npm install inside the generated project.",
      "Run npm run typecheck before starting Tauri.",
      "Run npm run dev when your Rust/Tauri toolchain is ready."
    ];
  }
  return ["Run npm install inside the generated project.", "Run npm run dev to start the app."];
}

// src/commands/new.ts
var ProjectNameSchema = z.string().min(1, "project name is required").regex(/^[a-z0-9._-]+$/, "project name may only contain lowercase letters, numbers, dots, underscores, and dashes").refine((value) => value !== "." && value !== "..", "project name cannot be . or ..");
function registerNewCommand(program, context) {
  program.command("new").description("Create an AI-workflow-ready project from a template.").argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`).argument("[project-name]", "project folder name").addHelpText(
    "after",
    `

Examples:
  $ agentkick new ai-saas myapp
  $ agentkick new chrome-extension browser-helper
  $ agentkick new electron-app desktop-studio
  $ agentkick new tauri-app native-studio
  $ agentkick new marketplace vendorhub
`
  ).action(async (template, projectName) => {
    applyWriteMode(program);
    const resolvedTemplate = await resolveTemplate(template);
    const resolvedName = sanitizeProjectName(projectName ?? await input({ message: "Project name:" }));
    const validation = ProjectNameSchema.safeParse(resolvedName);
    if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "invalid project name");
    const projectDir = path10.resolve(context.cwd, resolvedName);
    if (fs9.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);
    const defaultPacks = defaultPacksForTemplate(resolvedTemplate);
    const profile = {
      ...buildProfile(resolvedTemplate, resolvedName),
      packs: ["core", ...defaultPacks]
    };
    const spinner = isDryRun(program) ? null : createSpinner("Generating project files").start();
    try {
      writeTemplateProject(projectDir, profile);
      writeAgentFiles(projectDir, profile, { includeWorkflowMemory: false });
      writePack(projectDir, "core", profile, { updateConfig: false });
      for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });
      spinner?.succeed("Project files generated");
    } catch (error) {
      spinner?.fail("Project generation failed");
      throw error;
    }
    console.log(header("AgentKick project created", "AI workflow memory and agent instructions are ready."));
    console.log("");
    logger.success(`${resolvedName} created`);
    console.log(keyValue("Template", resolvedTemplate));
    console.log(keyValue("Location", pathLabel(projectDir)));
    console.log("");
    console.log(nextSteps([`cd ${resolvedName}`, ...postInstallStepsFor(resolvedTemplate)]));
  });
}
async function resolveTemplate(template) {
  const normalized = normalizeTemplate(template);
  if (normalized && isTemplate(normalized)) return normalized;
  if (template) throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
  return select({
    message: "Select project type:",
    choices: templateChoices()
  });
}
function isTemplate(value) {
  return SUPPORTED_TEMPLATES.includes(value);
}
function sanitizeProjectName(name) {
  return String(name ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
function normalizeTemplate(value) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-");
}

// src/commands/split-task.ts
import path11 from "path";
var TASK_AREAS = [
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
function registerSplitTaskCommand(program, context) {
  program.command("split-task").description("Split a broad coding request into scoped execution chunks.").argument("<task>", "broad task or feature request").option("--files <paths...>", "optional file or folder hints").option("--json", "print stable JSON output").addHelpText(
    "after",
    `

Examples:
  $ agentkick split-task "Add paid checkout and dashboard" --files src/app.ts src/billing.ts
  $ agentkick split-task "Improve extension popup" --json
`
  ).action((task, options) => {
    const profile = detectProject(context.cwd);
    const result = splitTask(context.cwd, profile, task, options.files ?? []);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(renderSplitTask(result));
  });
}
function splitTask(cwd, profile, task, fileHints) {
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
    nextCommand: nextCommandFor2(chunks),
    warnings,
    boundaries: [
      "No autonomous scheduling.",
      "No agent assignment.",
      "No semantic code ownership claims.",
      "No background jobs.",
      "No file writes by default.",
      `Repository: ${path11.basename(cwd)}`
    ]
  };
}
function selectTaskAreas(task, files, profile) {
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
function buildChunks(profile, task, areas, files) {
  const chunks = [];
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
      parallelizable: chunks.length > 1 || chunks.length === 1 && !needsInvestigation
    });
  }
  chunks.push({
    id: "verify-and-handoff",
    title: "Verify and prepare handoff",
    scope: "tests, build, agent summary, follow-up risks",
    nonGoals: ["Do not add new behavior while verifying.", "Do not hide failing checks."],
    dependencies: chunks.map((chunk) => chunk.id),
    suggestedFiles: [],
    verification: verificationCommand2(profile),
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
function filesForArea(area, files) {
  const matches = files.filter((file2) => {
    const lower = file2.toLowerCase();
    return area.keywords.some((keyword) => lower.includes(keyword));
  });
  return matches.length > 0 ? matches : files.slice(0, 4);
}
function verificationFor(profile, area) {
  if (area.id === "extension" && profile.stack.includes("chrome-extension")) return profile.buildCommand;
  if (area.id === "desktop" && (profile.stack.includes("electron") || profile.stack.includes("tauri")))
    return profile.buildCommand;
  return verificationCommand2(profile);
}
function verificationCommand2(profile) {
  if (profile.testCommand && !profile.testCommand.startsWith("document ")) return profile.testCommand;
  if (profile.buildCommand && !profile.buildCommand.startsWith("document ")) return profile.buildCommand;
  return "document the narrowest useful verification command before editing";
}
function promptFor(instruction, task, files) {
  const fileLine = files.length > 0 ? ` Suggested files: ${files.join(", ")}.` : " File scope is incomplete.";
  return `${instruction} Task: ${task}.${fileLine} Preserve unrelated changes and report verification.`;
}
function warningsFor(task, files, areas) {
  const warnings = [];
  if (files.length === 0) warnings.push("File scope is incomplete; start by confirming relevant entry points.");
  if (areas.length >= 4) warnings.push("Task appears broad; keep each chunk independent and avoid mixed refactors.");
  if (task.trim().split(/\s+/).length < 3) warnings.push("Task text is short; subtask scopes are best-effort.");
  return warnings;
}
function nextCommandFor2(chunks) {
  const first = chunks.find((chunk) => chunk.doFirst) ?? chunks[0];
  if (!first) return "agentkick focus <scope>";
  return `agentkick focus ${quoteScope(first.id === "confirm-scope" ? "current task" : first.id)}`;
}
function quoteScope(scope) {
  return /\s/.test(scope) ? `"${scope}"` : scope;
}
function normalizeFiles(files) {
  return [
    ...new Set(
      files.map((file2) => file2.trim()).filter(Boolean).map((file2) => file2.replace(/\\/g, "/"))
    )
  ];
}
function renderSplitTask(result) {
  const lines = [
    header("AgentKick split-task", "Rule-based execution chunks for one broad request."),
    "",
    keyValue("Task", result.task),
    keyValue("Detected stack", result.profile.stack),
    result.profile.capabilities.length ? keyValue("Capabilities", result.profile.capabilities.join(", ")) : "",
    result.files.length ? keyValue("File hints", result.files.map((file2) => pathLabel(file2)).join(", ")) : "",
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
function renderChunk(chunk, index) {
  return [
    `${index + 1}. ${chunk.doFirst ? "[do first] " : ""}${chunk.title}${chunk.parallelizable ? ` ${muted("(parallelizable)")}` : ""}`,
    `   ${keyValue("Scope", chunk.scope)}`,
    `   ${keyValue("Non-goals", chunk.nonGoals.join(" "))}`,
    `   ${keyValue("Dependencies", chunk.dependencies.length ? chunk.dependencies.join(", ") : "none")}`,
    `   ${keyValue(
      "Suggested files",
      chunk.suggestedFiles.length ? chunk.suggestedFiles.map((file2) => pathLabel(file2)).join(", ") : "unknown"
    )}`,
    `   ${keyValue("Verification", chunk.verification)}`,
    `   ${keyValue("Agent prompt", chunk.agentPrompt)}`
  ];
}

// src/commands/summarize.ts
function registerSummarizeCommand(program, context) {
  program.command("summarize").description("Compress workflow state for handoff or a fresh chat.").argument("[scope]", "optional feature, folder, or task scope").option("--task <task>", "task description to record in memory").option("--status <status>", "summary status: complete, blocked, or handoff").option("--handoff", "produce a short paste-ready handoff for a fresh chat").addHelpText(
    "after",
    `

Examples:
  $ agentkick summarize
  $ agentkick summarize --task "Improve README positioning"
  $ agentkick summarize --task "Improve README positioning" --handoff
  $ agentkick summarize auth
`
  ).action(async (scope, options) => {
    applyWriteMode(program, options);
    console.log(
      renderSummary(
        await buildWorkflowSummary(context.cwd, {
          scope,
          task: options.task,
          handoff: options.handoff,
          status: options.status
        })
      )
    );
  });
}

// src/commands/registry.ts
function registerCommands(program, context) {
  registerInitCommand(program, context);
  registerDoctorCommand(program, context);
  registerFocusCommand(program, context);
  registerSplitTaskCommand(program, context);
  registerSummarizeCommand(program, context);
  registerNewCommand(program, context);
  registerAddCommand(program, context);
}

// src/core/program.ts
function createProgram(cwd = process2.cwd()) {
  const program = new Command();
  const context = { cwd };
  program.name("agentkick").description("Repo-native workflow memory for AI-assisted development.").version(VERSION, "-v, --version").option("--dry-run", "show file operations without writing").showHelpAfterError().showSuggestionAfterError().addHelpText(
    "after",
    `

Examples:
  $ agentkick init
  $ agentkick doctor --debug
  $ agentkick focus auth
  $ agentkick split-task "add paid checkout"
  $ agentkick summarize
  $ agentkick new ai-saas myapp
  $ agentkick new electron-app desktop-studio

Workflow:
  init       write repo memory and agent instructions
  doctor     check AI workflow readiness
  focus      create scoped task context
  split-task break broad requests into scoped chunks
  summarize  compress current state for a fresh chat
`
  );
  registerCommands(program, context);
  return program;
}
async function run(argv, cwd = process2.cwd()) {
  const program = createProgram(cwd);
  await program.parseAsync(argv, { from: "user" });
}

// src/index.ts
run(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(errorMessage(message));
  const suggestion = suggestionFor(message);
  if (suggestion) console.error(hint(suggestion));
  process.exitCode = 1;
});
function suggestionFor(message) {
  if (message.includes("unknown template")) return "Run agentkick new --help to see supported project templates.";
  if (message.includes("unknown pack")) return "Run agentkick add --help to see supported workflow packs.";
  if (message.includes("target folder already exists"))
    return "Choose a new project name or remove the existing folder.";
  if (message.includes("project name is required")) return "Run agentkick new <template> <project-name>.";
  return "Run agentkick --help for available commands.";
}
//# sourceMappingURL=index.js.map