#!/usr/bin/env node

// src/core/program.ts
import process2 from "process";
import { Command } from "commander";

// src/core/constants.ts
var VERSION = "0.1.0";
var SUPPORTED_TEMPLATES = ["chrome-extension", "ai-saas", "saas", "marketplace", "internal-tool"];
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
  "electron"
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
    const existing = fs.readFileSync(file2, "utf8");
    if (existing === content) return;
    const backup = `${file2}.agentkick-backup`;
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, existing, "utf8");
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
    "internal-tool": ["vite", "react", "typescript", "internal-tool"]
  };
  const testCommandByTemplate = {
    "chrome-extension": "npm run check"
  };
  const buildCommandByTemplate = {
    "chrome-extension": "npm run package"
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
    "internal-tool": ["github"]
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
  const entries = sections.flatMap((section) => Object.keys(packageJson?.[section] ?? {}));
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
        `workspace: found project markers in child folders: ${workspaceHints.map((hint) => hint.path).join(", ")}`
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
    "vite",
    "node-api",
    "electron",
    "tauri",
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
  return entries.filter((entry) => entry.isDirectory() && !ignored.has(entry.name)).map((entry) => childProjectHint(cwd, entry.name)).filter((hint) => Boolean(hint)).slice(0, 8);
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
    "internal-tool": "Vercel, Netlify, or internal hosting"
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
    console.log(chalk.green(message));
  },
  warn(message) {
    console.log(chalk.yellow(message));
  },
  error(message) {
    console.error(chalk.red(message));
  },
  muted(message) {
    console.log(chalk.gray(message));
  }
};

// src/workflow/packs.ts
import path3 from "path";

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
function readmeFor(profile) {
  return `# ${titleize(profile.name)}

Generated with AgentKick.

## AI-Agent Ready

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

## AgentKick

\`\`\`bash
agentkick doctor
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
  if (notes.length === 0)
    notes.push("Generic: document missing commands before assuming test, build, or deploy behavior.");
  return notes;
}
function titleize(value) {
  return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

// src/workflow/packs.ts
var PACKS = {
  core(profile) {
    return [
      command(
        "review",
        "Review the current changes like a senior engineer. Prioritize bugs, regressions, missing tests, security risks, and unclear behavior. Use file and line references where possible."
      ),
      command(
        "write-tests",
        `Add or update tests for the current change. Use this project's documented test command: ${profile.testCommand}. If no test harness exists, explain the smallest practical test setup before adding dependencies.`
      ),
      command(
        "fix-ci",
        "Inspect the failing CI or local command output, identify the smallest root-cause fix, apply it, and rerun the relevant verification command."
      ),
      command(
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
    command(
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
    command(
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
    command(
      "debug-netlify-deploy",
      "Debug the Netlify deploy path. Check netlify.toml, publish directory, build command, environment variables, redirects, and whether the deploy ran from the correct working directory."
    ),
    file("docs/launch-checklist.md", launchChecklist(profile))
  ],
  security: () => [
    command(
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
    command(
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
    command(
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
    command(
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
    command(
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
    command(
      "electron-check",
      "Review the Electron app for main/preload/renderer boundaries, context isolation, IPC safety, packaging, auto-update risks, and desktop UX."
    ),
    agent(
      "electron-engineer",
      "Use this agent for Electron desktop apps, preload scripts, IPC, renderer UI, and packaging work.",
      "You are an Electron engineer. Keep Node access out of the renderer, use preload boundaries carefully, avoid broad IPC channels, and verify syntax before packaging."
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
function command(name, body) {
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
  const filePath = path3.join(cwd, ".agentkick.json");
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

// src/commands/add.ts
function registerAddCommand(program, context) {
  program.command("add").description("Add an AgentKick command/skill pack.").argument("<pack>", `pack: ${SUPPORTED_PACKS.join(", ")}`).action((pack) => {
    applyWriteMode(program);
    if (!isPack2(pack)) throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
    const profile = detectProject(context.cwd);
    writePack(context.cwd, pack, profile);
    logger.success(`Added ${pack} pack.`);
  });
}
function isPack2(value) {
  return SUPPORTED_PACKS.includes(value);
}

// src/doctor/doctor-engine.ts
import fs3 from "fs";
import path4 from "path";
var REQUIRED_AGENT_FILES = [
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
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
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
var IGNORED_DIRS = /* @__PURE__ */ new Set([
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
function runDoctor(cwd, options = {}) {
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
function auditRepo(cwd) {
  const packageInfo = readJsonSafe(path4.join(cwd, "package.json"));
  const config = readJsonSafe(path4.join(cwd, ".agentkick.json"));
  const profile = detectProject(cwd);
  const checks = REQUIRED_AGENT_FILES.map(([file2, label]) => requiredFile(cwd, file2, label));
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
function analyzeWorkflow(cwd, packageInfo, config) {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file2) => SOURCE_EXTENSIONS.has(file2.extension));
  const reactFiles = sourceFiles.filter((file2) => file2.isReact);
  const problems = [
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
function scanRepoFiles(cwd) {
  const results = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs3.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path4.join(dir, entry.name);
      const relativePath = slash(path4.relative(cwd, fullPath));
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path4.extname(entry.name).toLowerCase();
      if (!SOURCE_EXTENSIONS.has(extension) && !isMemoryFile(relativePath)) continue;
      const stats = fs3.statSync(fullPath);
      if (stats.size > 6e5) continue;
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
function memoryProblems(cwd) {
  const problems = [];
  for (const file2 of WORKFLOW_MEMORY_FILES) {
    const fullPath = path4.join(cwd, file2);
    if (!fs3.existsSync(fullPath)) {
      problems.push({
        severity: file2 === "AGENTS.md" ? "high" : "medium",
        category: "memory",
        title: `Missing workflow memory: ${file2}`,
        file: file2,
        detail: `${file2} is part of the durable repo memory layer agents should read before editing.`,
        suggestion: "Run agentkick init or add the missing memory file with concise project rules."
      });
      continue;
    }
    const content = readFileSafe(fullPath);
    if (content.trim().length < 80) {
      problems.push({
        severity: "medium",
        category: "memory",
        title: `Thin workflow memory: ${file2}`,
        file: file2,
        detail: `${file2} exists but is too small to carry useful agent context.`,
        suggestion: "Add purpose, boundaries, commands, and update rules in short markdown sections."
      });
    }
  }
  return problems;
}
function commandProblems(packageInfo, config) {
  const problems = [];
  const hasTest = Boolean(
    packageInfo?.scripts?.test || config?.testCommand && !config.testCommand.startsWith("document ")
  );
  const hasBuild = Boolean(
    packageInfo?.scripts?.build || config?.buildCommand && !config.buildCommand.startsWith("document ")
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
function fileSizeProblems(files) {
  return files.filter((file2) => file2.lines >= 700 || file2.bytes >= 6e4).slice(0, 12).map((file2) => ({
    severity: file2.lines >= 1200 || file2.bytes >= 12e4 ? "high" : "medium",
    category: "file-size",
    title: "Giant file",
    file: file2.relativePath,
    detail: `${file2.relativePath} has ${file2.lines} lines and is expensive for agents to load or edit safely.`,
    suggestion: "Split stable helpers, UI sections, and business logic into feature-scoped modules."
  }));
}
function reactComponentProblems(files) {
  const problems = [];
  for (const file2 of files) {
    const content = readFileSafe(file2.absolutePath);
    const hookCount = (content.match(/\buse[A-Z]\w*\(/g) ?? []).length;
    const jsxBlocks = (content.match(/return\s*\(/g) ?? []).length;
    if (file2.lines >= 320 || hookCount >= 9 || jsxBlocks >= 6) {
      problems.push({
        severity: file2.lines >= 600 || hookCount >= 14 ? "high" : "medium",
        category: "react-component",
        title: "Oversized React component",
        file: file2.relativePath,
        detail: `${file2.relativePath} has ${file2.lines} lines, ${hookCount} hook calls, and ${jsxBlocks} JSX return blocks.`,
        suggestion: "Extract feature sections, hooks, data adapters, and presentational components."
      });
    }
  }
  return problems.slice(0, 12);
}
function modularityProblems(cwd, sourceFiles) {
  const problems = [];
  const srcFiles = sourceFiles.filter((file2) => file2.relativePath.startsWith("src/"));
  const appFiles = sourceFiles.filter((file2) => file2.relativePath.startsWith("app/"));
  const topLevelSrcFiles = srcFiles.filter((file2) => file2.relativePath.split("/").length <= 2);
  const hasFeatureBoundary = directoryExists2(cwd, "src/features") || directoryExists2(cwd, "features");
  const hasCoreBoundary = directoryExists2(cwd, "src/core") || directoryExists2(cwd, "core");
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
function tokenWasteProblems(cwd, files) {
  const problems = [];
  const generatedFolders = ["coverage", "storybook-static", "public/assets", "public/generated", "docs/generated"];
  for (const folder of generatedFolders) {
    if (directoryExists2(cwd, folder)) {
      problems.push({
        severity: "low",
        category: "token-waste",
        title: "Generated or bulky assets in repo context",
        file: folder,
        detail: `${folder} exists and can pollute agent file searches if not excluded from task context.`,
        suggestion: "Document that agents should avoid this folder unless the task is explicitly about generated assets."
      });
    }
  }
  const longMarkdown = files.filter((file2) => file2.extension === ".md" && file2.lines >= 400 && !file2.relativePath.startsWith("docs/")).slice(0, 5);
  for (const file2 of longMarkdown) {
    problems.push({
      severity: "low",
      category: "token-waste",
      title: "Long root-context markdown",
      file: file2.relativePath,
      detail: `${file2.relativePath} has ${file2.lines} lines and may waste context during agent startup.`,
      suggestion: "Move durable reference material into docs/ and keep startup memory concise."
    });
  }
  return problems;
}
function taskIsolationProblems(cwd) {
  const problems = [];
  const hasCurrentTask = fs3.existsSync(path4.join(cwd, "CURRENT_TASK.md"));
  const hasArchitecture = fs3.existsSync(path4.join(cwd, "ARCHITECTURE.md"));
  const hasProjectMap = fs3.existsSync(path4.join(cwd, "docs", "PROJECT_MAP.md"));
  if (hasCurrentTask) {
    const currentTask = readFileSafe(path4.join(cwd, "CURRENT_TASK.md"));
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
function mcpProblems(cwd) {
  const problems = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path4.join(cwd, fileName);
    if (!fs3.existsSync(fullPath)) continue;
    const content = readFileSafe(fullPath);
    if (content.includes("C:\\\\") || content.includes("/") && content.includes("filesystem")) {
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
function ciProblems(cwd) {
  const workflowDir = path4.join(cwd, ".github", "workflows");
  if (fs3.existsSync(workflowDir)) return [];
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
function readinessScore(failures, problems) {
  const weights = { high: 12, medium: 7, low: 3 };
  const problemPenalty = problems.reduce((total, problem) => total + weights[problem.severity], 0);
  return Math.max(0, Math.min(100, 100 - failures.length * 9 - problemPenalty));
}
function printAudit(audit, options) {
  console.log("AgentKick doctor");
  console.log("");
  console.log(`AI Readiness Score: ${audit.score}/100`);
  console.log(`Status: ${audit.status}`);
  if (options.strict) console.log("Mode: strict");
  console.log("");
  console.log("Detected stack:");
  if (audit.detectedStack === "generic") {
    console.log("- generic");
    console.log("Could not confidently detect stack. Run agentkick doctor --debug to see checked files.");
    printWorkspaceHints(audit.detectionDebug);
  } else {
    for (const item of [audit.detectedStack, ...audit.detectedCapabilities]) console.log(`- ${item}`);
  }
  console.log("");
  if (audit.problems.length > 0) {
    console.log("Problems:");
    for (const problem of audit.problems) {
      const file2 = problem.file ? ` (${problem.file})` : "";
      console.log(`- [${problem.severity}] ${problem.title}${file2}`);
    }
    console.log("");
  }
  console.log("Workflow checks:");
  for (const check of audit.checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}: ${check.message}`);
  }
  if (audit.suggestions.length > 0) {
    console.log("");
    console.log("Suggested fixes:");
    for (const suggestion of audit.suggestions) console.log(`- ${suggestion}`);
  }
  if (options.debug) {
    printDetectionDebug(audit.detectionDebug);
    printWorkflowDebug(audit.analysis);
  }
}
function requiredFile(cwd, relativePath, label) {
  const fullPath = path4.join(cwd, relativePath);
  if (!fs3.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs3.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}
function suggestionsFor(failures, problems) {
  const suggestions = [];
  if (failures.some((item) => item.includes("AGENTS.md")))
    suggestions.push("Run agentkick init to regenerate the master repo intelligence layer.");
  if (failures.some((item) => item.includes(".claude/skills")))
    suggestions.push("Regenerate Claude skills with agentkick init.");
  if (failures.some((item) => item.includes(".codex/agents")))
    suggestions.push("Regenerate Codex specialist agents with agentkick init.");
  for (const problem of problems) suggestions.push(problem.suggestion);
  return [...new Set(suggestions)].slice(0, 10);
}
function problemMessage(problem) {
  return `${problem.title}${problem.file ? ` (${problem.file})` : ""}: ${problem.detail}`;
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
function directoryExists2(cwd, relativePath) {
  try {
    return fs3.statSync(path4.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}
function isMemoryFile(relativePath) {
  return relativePath.endsWith(".md") || relativePath === ".agentkick.json";
}
function slash(value) {
  return value.replace(/\\/g, "/");
}
function printDetectionDebug(detection) {
  console.log("");
  console.log("Stack detection debug:");
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
  console.log("Workflow analysis debug:");
  console.log(`Files scanned: ${analysis.filesScanned}`);
  console.log(`Source files scanned: ${analysis.sourceFiles}`);
  console.log(`React files scanned: ${analysis.reactFiles}`);
  console.log("Largest source files:");
  if (analysis.largestFiles.length === 0) {
    console.log("- none");
    return;
  }
  for (const file2 of analysis.largestFiles) {
    console.log(`- ${file2.relativePath} (${file2.lines} lines, ${file2.bytes} bytes)`);
  }
}
function printWorkspaceHints(detection) {
  if (detection.workspaceHints.length === 0) return;
  console.log("");
  console.log("This looks like a workspace folder, not a single app repo.");
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of detection.workspaceHints.slice(0, 5)) {
    console.log(`  cd ${hint.path}  # ${hint.stack}`);
  }
}
function printList(items) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(`- ${item}`);
}

// src/commands/doctor.ts
function registerDoctorCommand(program, context) {
  program.command("doctor").description("Check AI workflow readiness and stack detection.").option("--strict", "exit non-zero when readiness is blocked or below threshold").option("--json", "print JSON output").option("--debug", "print stack detection reasoning").action((options) => {
    runDoctor(context.cwd, options);
  });
}

// src/commands/focus.ts
import fs4 from "fs";
import path5 from "path";

// src/utils/format.ts
import chalk2 from "chalk";
function formatStack(profile) {
  return profile.primaryStack ?? profile.template ?? "generic";
}
function printDetectionSummary(profile) {
  console.log(`Detected stack: ${chalk2.bold(formatStack(profile))}`);
  if (profile.capabilities?.length) {
    console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  }
  if (formatStack(profile) === "generic") {
    console.log(chalk2.yellow("Could not confidently detect stack. Run agentkick doctor --debug to see checked files."));
    printWorkspaceHints2(profile.detection?.workspaceHints ?? []);
  }
}
function printWorkspaceHints2(hints) {
  if (hints.length === 0) return;
  console.log("");
  console.log(chalk2.yellow("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of hints.slice(0, 5)) {
    console.log(`  ${chalk2.cyan(`cd ${hint.path}`)}  ${chalk2.gray(`# ${hint.stack}`)}`);
  }
}

// src/commands/focus.ts
function registerFocusCommand(program, context) {
  program.command("focus").description("Print the minimal project context an agent should load before editing.").argument("[scope]", "optional feature, folder, or task scope").action((scope) => {
    const profile = detectProject(context.cwd);
    const candidates = ["AGENTS.md", "CLAUDE.md", ".agentkick.json", "package.json", "README.md", scope].filter(
      (item) => Boolean(item)
    );
    console.log("AgentKick focus");
    console.log("");
    console.log(`Scope: ${scope ?? "current task"}`);
    console.log(`Detected stack: ${formatStack(profile)}`);
    if (profile.capabilities?.length) console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
    console.log("");
    console.log("Load first:");
    for (const item of uniqueExisting(context.cwd, candidates)) console.log(`- ${item}`);
    console.log("");
    console.log("Working rule: keep the agent context limited to the scope, touched files, and repo memory above.");
  });
}
function uniqueExisting(cwd, candidates) {
  return [...new Set(candidates)].filter((candidate) => fs4.existsSync(path5.join(cwd, candidate)));
}

// src/commands/init.ts
function registerInitCommand(program, context) {
  program.command("init").description("Initialize AgentKick memory, agent instructions, and repo workflow files.").option("--dry-run", "show file operations without writing").action((options) => {
    applyWriteMode(program, options);
    const profile = detectProject(context.cwd);
    writeAgentFiles(context.cwd, profile);
    writePack(context.cwd, "core", profile);
    logger.success(`Initialized AI-agent setup for ${profile.name}.`);
    if (options.dryRun) logger.muted("Dry run only. No files were written.");
    printDetectionSummary(profile);
  });
}

// src/commands/new.ts
import fs5 from "fs";
import path6 from "path";
import { input, select } from "@inquirer/prompts";

// src/templates/project-templates.ts
var TEMPLATE_REGISTRY = {
  "ai-saas": {
    id: "ai-saas",
    label: "AI SaaS",
    description: "Next.js product shell with AI workflow, API, and feature boundaries.",
    files: aiSaasFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  "chrome-extension": {
    id: "chrome-extension",
    label: "Chrome Extension",
    description: "Manifest V3 extension with popup, background, content, and shared modules.",
    files: chromeExtensionFiles,
    nextSteps: ["npm install", "npm run package", "agentkick doctor"]
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Next.js marketplace starter with vendor, listing, order, and admin boundaries.",
    files: marketplaceFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Next.js SaaS starter with account, billing, workspace, and API boundaries.",
    files: saasFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  "internal-tool": {
    id: "internal-tool",
    label: "Internal Tool",
    description: "Vite React operations tool with dashboard, workflow, and API-client boundaries.",
    files: internalToolFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
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
function writeTemplateProject(projectDir, profile) {
  const template = getTemplateDefinition(profile.template);
  if (!template) throw new Error(`template writer missing for "${profile.template}"`);
  for (const file2 of sharedMemoryFiles(profile, template)) {
    writeFile(projectDir, file2.path, render(file2.content, variablesFor(profile, template)));
  }
  for (const file2 of template.files(profile)) {
    writeFile(projectDir, file2.path, render(file2.content, variablesFor(profile, template)));
  }
  writeFile(projectDir, "README.md", readmeFor(profile));
  writeFile(projectDir, ".gitignore", gitignoreFor(profile));
}
function postInstallStepsFor(template) {
  return getTemplateDefinition(template).nextSteps;
}
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
function gitignoreFor(profile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/", "*.agentkick-backup"];
  const stackItems = ["node_modules/"];
  if (profile.stack.includes("nextjs")) stackItems.push(".next/", "out/");
  if (profile.stack.includes("vite")) stackItems.push(".vite/");
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

// src/commands/new.ts
function registerNewCommand(program, context) {
  program.command("new").description("Create a new agent-ready project from a supported template.").argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`).argument("[project-name]", "project folder name").action(async (template, projectName) => {
    applyWriteMode(program);
    const resolvedTemplate = await resolveTemplate(template);
    const resolvedName = sanitizeProjectName(projectName ?? await input({ message: "Project name:" }));
    if (!resolvedName) throw new Error("project name is required");
    const projectDir = path6.resolve(context.cwd, resolvedName);
    if (fs5.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);
    const defaultPacks = defaultPacksForTemplate(resolvedTemplate);
    const profile = {
      ...buildProfile(resolvedTemplate, resolvedName),
      packs: ["core", ...defaultPacks]
    };
    writeTemplateProject(projectDir, profile);
    writeAgentFiles(projectDir, profile, { includeWorkflowMemory: false });
    writePack(projectDir, "core", profile, { updateConfig: false });
    for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });
    logger.success(`Created ${resolvedName} using ${resolvedTemplate}.`);
    console.log("Next steps:");
    console.log(`  cd ${resolvedName}`);
    for (const step of postInstallStepsFor(resolvedTemplate)) console.log(`  ${step}`);
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

// src/core/config.ts
import path7 from "path";
import { z } from "zod";
var AgentKickConfigSchema = z.object({
  schemaVersion: z.number().optional(),
  name: z.string().optional(),
  stack: z.array(z.string()).optional(),
  packageManager: z.string().optional(),
  testCommand: z.string().optional(),
  buildCommand: z.string().optional(),
  launchTarget: z.string().optional(),
  packs: z.array(z.string()).optional(),
  safety: z.object({
    preserveBackups: z.boolean().optional(),
    mcpFilesystemScope: z.string().optional(),
    destructiveActionsRequireApproval: z.boolean().optional()
  }).optional()
}).passthrough();
function loadConfig(cwd) {
  const raw = readJsonSafe(path7.join(cwd, ".agentkick.json"));
  if (!raw) return null;
  const parsed = AgentKickConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

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

// src/commands/summarize.ts
function registerSummarizeCommand(program, context) {
  program.command("summarize").description("Summarize the current repo for handoff or thread reset.").argument("[scope]", "optional feature, folder, or task scope").action(async (scope) => {
    const profile = detectProject(context.cwd);
    const config = loadConfig(context.cwd);
    const branch = await gitBranch(context.cwd);
    console.log("AgentKick summary");
    console.log("");
    console.log(`Project: ${profile.name}`);
    if (scope) console.log(`Scope: ${scope}`);
    if (branch) console.log(`Git branch: ${branch}`);
    console.log(`Stack: ${formatStack(profile)}`);
    if (profile.capabilities?.length) console.log(`Capabilities: ${profile.capabilities.join(", ")}`);
    console.log(`Package manager: ${profile.packageManager}`);
    console.log(`Test: ${config?.testCommand ?? profile.testCommand}`);
    console.log(`Build: ${config?.buildCommand ?? profile.buildCommand}`);
    console.log("");
    console.log("Recommended next step: run agentkick focus before giving a coding agent a new task.");
  });
}

// src/commands/registry.ts
function registerCommands(program, context) {
  registerInitCommand(program, context);
  registerDoctorCommand(program, context);
  registerFocusCommand(program, context);
  registerSummarizeCommand(program, context);
  registerNewCommand(program, context);
  registerAddCommand(program, context);
}

// src/core/program.ts
function createProgram(cwd = process2.cwd()) {
  const program = new Command();
  const context = { cwd };
  program.name("agentkick").description("Workflow infrastructure for AI-assisted software development.").version(VERSION, "-v, --version").option("--dry-run", "show file operations without writing");
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
  console.error(`agentkick failed: ${message}`);
  process.exitCode = 1;
});
//# sourceMappingURL=index.js.map