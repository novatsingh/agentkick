#!/usr/bin/env node

// src/cli.ts
import fs4 from "fs";
import path5 from "path";
import process2 from "process";
import readline from "readline/promises";
import { Command } from "commander";

// src/fs-utils.ts
import fs from "fs";
import path from "path";
var writeMode = { dryRun: false };
function setWriteMode(mode) {
  writeMode = { ...writeMode, ...mode };
}
function ensureDir(dir) {
  if (writeMode.dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
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

// src/agent-files.ts
function writeAgentFiles(cwd, profile) {
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

## AI-Agent Ready

This repo includes:

- \`AGENTS.md\` for Codex and other coding agents
- \`CLAUDE.md\` for Claude Code
- \`.claude/commands\` reusable agent workflows
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

// src/constants.ts
var VERSION = "0.1.0";
var SUPPORTED_TEMPLATES = [
  "chrome-extension",
  "nextjs",
  "landing-page",
  "node-cli",
  "fastapi",
  "flask",
  "laravel",
  "go-cli",
  "rust-cli",
  "electron"
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
  "electron"
];

// src/doctor.ts
import fs3 from "fs";
import path3 from "path";

// src/profile.ts
import fs2 from "fs";
import path2 from "path";
function buildProfile(template, projectName) {
  const stackByTemplate = {
    "chrome-extension": ["chrome-extension", "javascript", "browser"],
    nextjs: ["nextjs", "react", "typescript"],
    "landing-page": ["static-site", "netlify"],
    "node-cli": ["node-cli", "javascript"],
    fastapi: ["fastapi", "python", "api"],
    flask: ["flask", "python", "api"],
    laravel: ["laravel", "php", "web"],
    "go-cli": ["go", "cli"],
    "rust-cli": ["rust", "cli"],
    electron: ["electron", "javascript", "desktop"]
  };
  const packageManagerByTemplate = {
    fastapi: "python",
    flask: "python",
    laravel: "composer",
    "go-cli": "go",
    "rust-cli": "cargo"
  };
  const testCommandByTemplate = {
    "landing-page": "npm run check",
    fastapi: "python -m pytest",
    flask: "python -m pytest",
    laravel: "php artisan test",
    "go-cli": "go test ./...",
    "rust-cli": "cargo test"
  };
  const buildCommandByTemplate = {
    "chrome-extension": "npm run package",
    fastapi: "python -m compileall app tests",
    flask: "python -m compileall app tests",
    laravel: "composer install && php artisan test",
    "go-cli": "go build ./...",
    "rust-cli": "cargo build"
  };
  return {
    name: projectName,
    template,
    stack: stackByTemplate[template] ?? ["generic"],
    packageManager: packageManagerByTemplate[template] ?? "npm",
    testCommand: testCommandByTemplate[template] ?? "npm test",
    buildCommand: buildCommandByTemplate[template] ?? "npm run build",
    launchTarget: launchTargetFor(template)
  };
}
function detectProject(cwd) {
  const packageJson = readJsonSafe(path2.join(cwd, "package.json"));
  const name = (packageJson == null ? void 0 : packageJson.name) ?? path2.basename(cwd);
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
    nextjs: ["nextjs"],
    "landing-page": ["netlify"],
    "node-cli": ["github"],
    fastapi: ["python"],
    flask: ["python"],
    laravel: ["php"],
    "go-cli": ["go", "github"],
    "rust-cli": ["rust", "github"],
    electron: ["electron", "github"]
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
  const entries = sections.flatMap((section) => Object.keys((packageJson == null ? void 0 : packageJson[section]) ?? {}));
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
  const chromeManifest = manifestFiles.find((file2) => {
    var _a;
    return (_a = readJsonSafe(path2.join(cwd, file2))) == null ? void 0 : _a.manifest_version;
  });
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
  if (packageJson == null ? void 0 : packageJson.bin) addPrimary("node-cli", "package.json defines bin");
  const primaryStack = pickPrimaryStack(primaryCandidates);
  const orderedCapabilities = orderLabels(
    [.../* @__PURE__ */ new Set([...capabilities, ...primaryCandidates])].filter((label) => label !== primaryStack)
  );
  if (primaryStack === "generic") {
    reasoning.push("generic: no supported stack markers were found");
  }
  return {
    cwd,
    primaryStack,
    capabilities: orderedCapabilities,
    detected: primaryStack === "generic" ? [] : [primaryStack, ...orderedCapabilities],
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
    "fastapi",
    "flask",
    "laravel",
    "go",
    "rust",
    "python",
    "php",
    "react",
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
    "docker",
    "netlify",
    "nextjs",
    "vite",
    "node-api",
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
  var _a;
  if ((_a = packageJson == null ? void 0 : packageJson.scripts) == null ? void 0 : _a.test) return `${packageManagerCommand(cwd)} test`;
  if (stack.includes("laravel")) return "php artisan test";
  if (stack.includes("go")) return "go test ./...";
  if (stack.includes("rust")) return "cargo test";
  if (stack.includes("python")) return "python -m pytest";
  return "document the test command";
}
function detectBuildCommand(cwd, packageJson, stack) {
  var _a;
  if ((_a = packageJson == null ? void 0 : packageJson.scripts) == null ? void 0 : _a.build) return `${packageManagerCommand(cwd)} run build`;
  if (stack.includes("laravel")) return "composer install && php artisan test";
  if (stack.includes("go")) return "go build ./...";
  if (stack.includes("rust")) return "cargo build";
  if (stack.includes("python")) return "python -m compileall .";
  return "document the build command";
}
function launchTargetFor(template) {
  const launchTargets = {
    "landing-page": "Netlify",
    fastapi: "Docker or Render",
    flask: "Docker or Render",
    laravel: "Laravel hosting",
    "go-cli": "GitHub Releases",
    "rust-cli": "GitHub Releases",
    electron: "GitHub Releases"
  };
  return launchTargets[template] ?? "GitHub";
}

// src/doctor.ts
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
  const packageInfo = readJsonSafe(path3.join(cwd, "package.json"));
  const config = readJsonSafe(path3.join(cwd, ".agentkick.json"));
  const profile = detectProject(cwd);
  const checks = [
    requiredFile(cwd, "AGENTS.md", "master repo intelligence"),
    requiredFile(cwd, "CLAUDE.md", "Claude memory"),
    requiredFile(cwd, ".github/copilot-instructions.md", "Copilot root instructions"),
    requiredFile(cwd, ".github/instructions/security.instructions.md", "Copilot security instructions"),
    requiredFile(cwd, ".claude/skills/review/SKILL.md", "Claude review skill"),
    requiredFile(cwd, ".claude/skills/security-scan/SKILL.md", "Claude security skill"),
    requiredFile(cwd, ".agents/skills/review/SKILL.md", "generic review skill"),
    requiredFile(cwd, ".codex/agents/reviewer.md", "Codex reviewer agent"),
    requiredFile(cwd, ".cursor/rules/agentkick.mdc", "Cursor rules"),
    requiredFile(cwd, ".agentkick.json", "AgentKick config")
  ];
  const warnings = [
    ...qualityWarnings(cwd),
    ...commandWarnings(packageInfo, config),
    ...findRiskyMcp(cwd),
    ...ciWarnings(cwd)
  ];
  const failures = checks.filter((check) => !check.ok).map((check) => check.message);
  const score = Math.max(0, 100 - failures.length * 10 - warnings.length * 4);
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
      filesChecked: [],
      dependencies: [],
      configFiles: [],
      reasoning: []
    },
    checks,
    warnings,
    failures,
    suggestions: suggestionsFor(failures, warnings)
  };
}
function printAudit(audit, options) {
  console.log("AgentKick doctor");
  console.log("");
  console.log(`Detected stack: ${audit.detectedStack}`);
  if (audit.detectedCapabilities.length > 0)
    console.log(`Detected capabilities: ${audit.detectedCapabilities.join(", ")}`);
  if (audit.detectedStack === "generic") {
    console.log("Could not confidently detect stack. Run agentkick doctor --debug to see checked files.");
  }
  console.log("");
  console.log(`AI-readiness score: ${audit.score}/100`);
  console.log(`Status: ${audit.status}`);
  if (options.strict) console.log("Mode: strict");
  console.log("");
  for (const check of audit.checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}: ${check.message}`);
  }
  for (const warning of audit.warnings) {
    console.log(`WARN ${warning}`);
  }
  if (audit.suggestions.length > 0) {
    console.log("");
    console.log("Suggested fixes:");
    for (const suggestion of audit.suggestions) console.log(`- ${suggestion}`);
  }
  if (options.debug) printDetectionDebug(audit.detectionDebug);
}
function requiredFile(cwd, relativePath, label) {
  const fullPath = path3.join(cwd, relativePath);
  if (!fs3.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs3.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}
function qualityWarnings(cwd) {
  const warnings = [];
  const agents = readFileSafe(path3.join(cwd, "AGENTS.md"));
  if (agents && !agents.includes("Forbidden")) warnings.push("AGENTS.md should define forbidden modifications.");
  if (agents && !agents.includes("Test:")) warnings.push("AGENTS.md should document test commands.");
  if (agents && !agents.includes("Build:")) warnings.push("AGENTS.md should document build commands.");
  const claude = readFileSafe(path3.join(cwd, "CLAUDE.md"));
  if (claude && claude.split(/\r?\n/).length > 200) warnings.push("CLAUDE.md should stay under 200 lines.");
  return warnings;
}
function commandWarnings(packageInfo, config) {
  const warnings = [];
  if (packageInfo == null ? void 0 : packageInfo.scripts) {
    if (!packageInfo.scripts.test && (!(config == null ? void 0 : config.testCommand) || config.testCommand.startsWith("document ")))
      warnings.push("No test command documented.");
    if (!packageInfo.scripts.build && (!(config == null ? void 0 : config.buildCommand) || config.buildCommand.startsWith("document ")))
      warnings.push("No build command documented.");
  } else if (!(config == null ? void 0 : config.testCommand) || config.testCommand.startsWith("document ")) {
    warnings.push("No package scripts or documented test command detected.");
  }
  return warnings;
}
function ciWarnings(cwd) {
  const workflowDir = path3.join(cwd, ".github", "workflows");
  if (!fs3.existsSync(workflowDir)) return ["No GitHub Actions workflow detected."];
  return [];
}
function findRiskyMcp(cwd) {
  const warnings = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path3.join(cwd, fileName);
    if (!fs3.existsSync(fullPath)) continue;
    const content = fs3.readFileSync(fullPath, "utf8");
    if (content.includes("C:\\\\") || content.includes("/") && content.includes("filesystem")) {
      warnings.push(`MCP safety: ${fileName} may allow broad filesystem access. Restrict it to this repo if possible.`);
    }
    if (content.includes("*") && content.includes("command"))
      warnings.push(`MCP safety: ${fileName} may allow wildcard command execution.`);
    if (content.includes("env") && content.includes("SECRET"))
      warnings.push(`MCP safety: ${fileName} may expose secret-like environment variables.`);
  }
  return warnings;
}
function suggestionsFor(failures, warnings) {
  const suggestions = [];
  if (failures.some((item) => item.includes("AGENTS.md")))
    suggestions.push("Run agentkick init to regenerate the master repo intelligence layer.");
  if (failures.some((item) => item.includes(".claude/skills")))
    suggestions.push("Regenerate Claude skills with agentkick init.");
  if (failures.some((item) => item.includes(".codex/agents")))
    suggestions.push("Regenerate Codex specialist agents with agentkick init.");
  if (warnings.some((item) => item.includes("MCP safety")))
    suggestions.push("Restrict MCP tools to repo-scoped paths and explicit allowlists.");
  if (warnings.some((item) => item.includes("workflow")))
    suggestions.push("Add a CI workflow or run agentkick add github.");
  return [...new Set(suggestions)];
}
function readFileSafe(file2) {
  try {
    return fs3.readFileSync(file2, "utf8");
  } catch {
    return "";
  }
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
function printList(items) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(`- ${item}`);
}

// src/packs.ts
import path4 from "path";
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
  var _a;
  if (!isPack(pack)) throw new Error(`pack writer missing for "${pack}"`);
  const entries = (_a = PACKS[pack]) == null ? void 0 : _a.call(PACKS, profile);
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
  const filePath = path4.join(cwd, ".agentkick.json");
  const current = readJsonSafe(filePath) ?? {};
  const packs = /* @__PURE__ */ new Set([...current.packs ?? [], ...patch.addedPacks ?? []]);
  current.packs = [...packs].sort();
  writeAbsoluteFile(filePath, json(current));
}
function isPack(value) {
  return Object.prototype.hasOwnProperty.call(PACKS, value);
}

// src/templates.ts
function writeTemplateProject(projectDir, profile) {
  switch (profile.template) {
    case "chrome-extension":
      writeChromeExtension(projectDir, profile);
      break;
    case "nextjs":
      writeNextjs(projectDir, profile);
      break;
    case "landing-page":
      writeLandingPage(projectDir, profile);
      break;
    case "node-cli":
      writeNodeCli(projectDir, profile);
      break;
    case "fastapi":
      writeFastApi(projectDir, profile);
      break;
    case "flask":
      writeFlask(projectDir, profile);
      break;
    case "laravel":
      writeLaravel(projectDir, profile);
      break;
    case "go-cli":
      writeGoCli(projectDir, profile);
      break;
    case "rust-cli":
      writeRustCli(projectDir, profile);
      break;
    case "electron":
      writeElectron(projectDir, profile);
      break;
    default:
      throw new Error(`template writer missing for "${profile.template}"`);
  }
  writeFile(projectDir, "README.md", readmeFor(profile));
  writeFile(projectDir, ".gitignore", gitignoreFor(profile));
}
function writeChromeExtension(projectDir, profile) {
  writeFile(
    projectDir,
    "package.json",
    json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      scripts: {
        check: "node --check src/background.js && node --check src/popup.js",
        package: "node scripts/package-extension.js",
        test: "npm run check"
      },
      devDependencies: {}
    })
  );
  writeFile(
    projectDir,
    "manifest.json",
    json({
      manifest_version: 3,
      name: titleize2(profile.name),
      version: "0.1.0",
      description: "Chrome extension scaffold generated by AgentKick.",
      action: { default_popup: "src/popup.html" },
      background: { service_worker: "src/background.js", type: "module" },
      permissions: ["storage"]
    })
  );
  writeFile(
    projectDir,
    "src/background.js",
    "chrome.runtime.onInstalled.addListener(() => {\n  console.log('Extension installed.');\n});\n"
  );
  writeFile(
    projectDir,
    "src/popup.html",
    htmlPage(
      "AgentKick Extension",
      '<button id="run">Run</button>\n      <p id="status">Ready</p>',
      '<script type="module" src="popup.js"></script>'
    )
  );
  writeFile(
    projectDir,
    "src/popup.css",
    "body { margin: 0; width: 360px; font-family: Georgia, serif; background: #f5efe2; color: #221b14; }\nmain { padding: 18px; }\nbutton { border: 0; border-radius: 999px; padding: 10px 14px; background: #1f5134; color: white; cursor: pointer; }\n"
  );
  writeFile(
    projectDir,
    "src/popup.js",
    "const button = document.querySelector('#run');\nconst status = document.querySelector('#status');\n\nbutton.addEventListener('click', () => {\n  status.textContent = 'Clicked.';\n});\n"
  );
  writeFile(
    projectDir,
    "scripts/package-extension.js",
    "import fs from 'node:fs';\nimport path from 'node:path';\n\nconst outDir = path.resolve('dist');\nfs.mkdirSync(outDir, { recursive: true });\nconsole.log('Package step placeholder. Add zip creation before publishing.');\n"
  );
}
function writeNextjs(projectDir, profile) {
  writeFile(
    projectDir,
    "package.json",
    json({
      name: profile.name,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start", test: "npm run build" },
      dependencies: { next: "latest", react: "latest", "react-dom": "latest" },
      devDependencies: { typescript: "latest", "@types/node": "latest", "@types/react": "latest" }
    })
  );
  writeFile(
    projectDir,
    "app/page.tsx",
    "export default function Home() {\n  return (\n    <main>\n      <h1>AgentKick Next.js App</h1>\n      <p>Start building with agent-ready project instructions.</p>\n    </main>\n  );\n}\n"
  );
  writeFile(
    projectDir,
    "app/layout.tsx",
    `import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );
  writeFile(
    projectDir,
    "app/globals.css",
    "body { margin: 0; font-family: Georgia, serif; background: #f6f0e6; color: #1f1b16; }\nmain { min-height: 100vh; display: grid; place-content: center; padding: 32px; }\n"
  );
  writeFile(projectDir, "next.config.mjs", "const nextConfig = {};\nexport default nextConfig;\n");
  writeFile(
    projectDir,
    "tsconfig.json",
    json({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    })
  );
}
function writeLandingPage(projectDir, profile) {
  writeFile(
    projectDir,
    "package.json",
    json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      scripts: { dev: "node scripts/serve.js", check: "node --check scripts/serve.js", build: "npm run check" }
    })
  );
  writeFile(
    projectDir,
    "index.html",
    '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>AgentKick Launch</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <main class="hero">\n      <p class="eyebrow">Agent-ready from day one</p>\n      <h1>Launch faster with Codex, Claude, Cursor, and GitHub ready.</h1>\n      <p>Create the product, repo instructions, commands, and launch checklist together.</p>\n      <a href="https://github.com/" class="cta">Star on GitHub</a>\n    </main>\n  </body>\n</html>\n'
  );
  writeFile(
    projectDir,
    "styles.css",
    ":root { color-scheme: light; --ink: #1d1912; --paper: #f4ead7; --accent: #b7442e; }\nbody { margin: 0; min-height: 100vh; font-family: Georgia, serif; background: radial-gradient(circle at top left, #ffd9a3, transparent 35%), var(--paper); color: var(--ink); }\n.hero { max-width: 880px; padding: 96px 28px; margin: auto; }\n.eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 13px; }\nh1 { font-size: clamp(42px, 8vw, 88px); line-height: .92; margin: 0 0 24px; }\np { font-size: 20px; max-width: 620px; }\n.cta { display: inline-block; margin-top: 18px; padding: 14px 18px; border-radius: 999px; background: var(--accent); color: white; text-decoration: none; }\n"
  );
  writeFile(
    projectDir,
    "scripts/serve.js",
    "import http from 'node:http';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst server = http.createServer((request, response) => {\n  const file = request.url === '/styles.css' ? 'styles.css' : 'index.html';\n  const body = fs.readFileSync(path.resolve(file));\n  response.setHeader('content-type', file.endsWith('.css') ? 'text/css' : 'text/html');\n  response.end(body);\n});\n\nserver.listen(3000, () => console.log('http://localhost:3000'));\n"
  );
  writeFile(projectDir, "netlify.toml", '[build]\n  publish = "."\n  command = "npm run build"\n');
}
function writeNodeCli(projectDir, profile) {
  writeFile(
    projectDir,
    "package.json",
    json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      bin: { [profile.name]: "./bin/cli.js" },
      scripts: { check: "node --check bin/cli.js", test: "npm run check" }
    })
  );
  writeFile(projectDir, "bin/cli.js", "#!/usr/bin/env node\nconsole.log('Hello from your AgentKick CLI.');\n");
}
function writeFastApi(projectDir, profile) {
  writeFile(
    projectDir,
    "pyproject.toml",
    pythonProject(profile, "FastAPI app generated by AgentKick.", ["fastapi", "uvicorn[standard]"], ["pytest", "httpx"])
  );
  writeFile(
    projectDir,
    "app/main.py",
    'from fastapi import FastAPI\n\napp = FastAPI(title="AgentKick FastAPI App")\n\n\n@app.get("/")\ndef read_root():\n    return {"status": "ok", "service": "agentkick"}\n'
  );
  writeFile(
    projectDir,
    "tests/test_health.py",
    'from fastapi.testclient import TestClient\n\nfrom app.main import app\n\n\ndef test_read_root():\n    client = TestClient(app)\n    response = client.get("/")\n    assert response.status_code == 200\n    assert response.json()["status"] == "ok"\n'
  );
  writeFile(
    projectDir,
    "Dockerfile",
    'FROM python:3.12-slim\nWORKDIR /app\nCOPY pyproject.toml ./\nRUN pip install --no-cache-dir .\nCOPY app ./app\nCMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]\n'
  );
}
function writeFlask(projectDir, profile) {
  writeFile(
    projectDir,
    "pyproject.toml",
    pythonProject(profile, "Flask app generated by AgentKick.", ["flask"], ["pytest"])
  );
  writeFile(
    projectDir,
    "app/__init__.py",
    'from flask import Flask\n\n\ndef create_app():\n    app = Flask(__name__)\n\n    @app.get("/")\n    def index():\n        return {"status": "ok", "service": "agentkick"}\n\n    return app\n'
  );
  writeFile(projectDir, "wsgi.py", "from app import create_app\n\napp = create_app()\n");
  writeFile(
    projectDir,
    "tests/test_app.py",
    'from app import create_app\n\n\ndef test_index():\n    app = create_app()\n    client = app.test_client()\n    response = client.get("/")\n    assert response.status_code == 200\n    assert response.json["status"] == "ok"\n'
  );
}
function writeLaravel(projectDir, profile) {
  writeFile(
    projectDir,
    "composer.json",
    json({
      name: `${profile.name}/app`,
      description: "Laravel app scaffold metadata generated by AgentKick.",
      type: "project",
      require: { php: "^8.2", "laravel/framework": "^12.0" },
      scripts: { test: "php artisan test" }
    })
  );
  writeFile(
    projectDir,
    "artisan",
    '#!/usr/bin/env php\n<?php\n\necho "Install Laravel dependencies or replace this placeholder with a full Laravel app.\\n";\n'
  );
  writeFile(
    projectDir,
    "routes/web.php",
    "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::get('/', function () {\n    return ['status' => 'ok', 'service' => 'agentkick'];\n});\n"
  );
  writeFile(
    projectDir,
    "tests/Feature/HealthTest.php",
    "<?php\n\ntest('application returns ok', function () {\n    $response = $this->get('/');\n    $response->assertOk();\n});\n"
  );
}
function writeGoCli(projectDir, profile) {
  writeFile(projectDir, "go.mod", `module ${goModuleName(profile.name)}

go 1.23
`);
  writeFile(
    projectDir,
    "main.go",
    'package main\n\nimport "fmt"\n\nfunc main() {\n	fmt.Println(message())\n}\n\nfunc message() string {\n	return "Hello from your AgentKick Go CLI."\n}\n'
  );
  writeFile(
    projectDir,
    "main_test.go",
    'package main\n\nimport "testing"\n\nfunc TestMessage(t *testing.T) {\n	if message() == "" {\n		t.Fatal("message should not be empty")\n	}\n}\n'
  );
}
function writeRustCli(projectDir, profile) {
  writeFile(
    projectDir,
    "Cargo.toml",
    `[package]
name = "${profile.name}"
version = "0.1.0"
edition = "2021"

[dependencies]
`
  );
  writeFile(
    projectDir,
    "src/main.rs",
    `fn main() {
    println!("{}", message());
}

fn message() -> &'static str {
    "Hello from your AgentKick Rust CLI."
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn message_is_not_empty() {
        assert!(!message().is_empty());
    }
}
`
  );
}
function writeElectron(projectDir, profile) {
  writeFile(
    projectDir,
    "package.json",
    json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      main: "src/main.js",
      scripts: {
        dev: "electron .",
        check: "node --check src/main.js && node --check src/preload.js && node --check src/renderer.js",
        test: "npm run check",
        build: "npm run check"
      },
      devDependencies: { electron: "latest" }
    })
  );
  writeFile(
    projectDir,
    "src/main.js",
    "import { app, BrowserWindow } from 'electron';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\nfunction createWindow() {\n  const window = new BrowserWindow({ width: 980, height: 680, webPreferences: { preload: path.join(__dirname, 'preload.js') } });\n  window.loadFile(path.join(__dirname, 'index.html'));\n}\n\napp.whenReady().then(createWindow);\napp.on('window-all-closed', () => {\n  if (process.platform !== 'darwin') app.quit();\n});\n"
  );
  writeFile(
    projectDir,
    "src/preload.js",
    "window.addEventListener('DOMContentLoaded', () => {\n  document.body.dataset.agentkick = 'ready';\n});\n"
  );
  writeFile(
    projectDir,
    "src/renderer.js",
    "document.querySelector('#status').textContent = 'AgentKick desktop app ready.';\n"
  );
  writeFile(
    projectDir,
    "src/index.html",
    htmlPage(
      "AgentKick Electron App",
      '<p id="status">Loading...</p>',
      '<script type="module" src="renderer.js"></script>'
    )
  );
  writeFile(
    projectDir,
    "src/styles.css",
    "body { margin: 0; font-family: Georgia, serif; background: #101820; color: #f8f0df; }\nmain { min-height: 100vh; display: grid; place-content: center; padding: 32px; }\nh1 { font-size: 52px; margin: 0 0 12px; }\n"
  );
}
function pythonProject(profile, description, dependencies, devDependencies) {
  return `[project]
name = "${profile.name}"
version = "0.1.0"
description = "${description}"
requires-python = ">=3.11"
dependencies = [
${dependencies.map((item) => `  "${item}"`).join(",\n")}
]

[project.optional-dependencies]
dev = [${devDependencies.map((item) => `"${item}"`).join(", ")}]

[tool.pytest.ini_options]
testpaths = ["tests"]
`;
}
function htmlPage(title, body, script) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      ${body}
    </main>
    ${script}
  </body>
</html>
`;
}
function gitignoreFor(profile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/"];
  const byStack = [];
  if (profile.stack.some((item) => ["javascript", "typescript", "nextjs", "electron", "node-cli"].includes(item)))
    byStack.push("node_modules/", ".next/", "out/");
  if (profile.stack.includes("python")) byStack.push(".venv/", "__pycache__/", "*.pyc", ".pytest_cache/");
  if (profile.stack.includes("php") || profile.stack.includes("laravel"))
    byStack.push("vendor/", "storage/logs/*.log", ".phpunit.result.cache");
  if (profile.stack.includes("go")) byStack.push("*.test", "coverage.out");
  if (profile.stack.includes("rust")) byStack.push("target/");
  return `${[.../* @__PURE__ */ new Set([...common, ...byStack])].join("\n")}
`;
}
function goModuleName(name) {
  return name.replace(/[^a-zA-Z0-9/_-]/g, "-").replace(/^-+|-+$/g, "") || "agentkick-app";
}
function titleize2(value) {
  return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

// src/cli.ts
function createProgram(cwd = process2.cwd()) {
  const program = new Command();
  program.name("agentkick").description("Workflow infrastructure for AI-assisted software development.").version(VERSION, "-v, --version").option("--dry-run", "show file operations without writing");
  program.command("init").description("Initialize AgentKick memory, agent instructions, and repo workflow files.").option("--dry-run", "show file operations without writing").action((options) => {
    applyWriteMode(program, options);
    initExistingProject(cwd, options);
  });
  program.command("doctor").description("Check AI workflow readiness and stack detection.").option("--strict", "exit non-zero when readiness is blocked or below threshold").option("--json", "print JSON output").option("--debug", "print stack detection reasoning").action((options) => {
    runDoctor(cwd, options);
  });
  program.command("focus").description("Print the minimal project context an agent should load before editing.").argument("[scope]", "optional feature, folder, or task scope").action((scope) => {
    printFocus(cwd, scope);
  });
  program.command("summarize").description("Summarize the current repo for handoff or thread reset.").argument("[scope]", "optional feature, folder, or task scope").action((scope) => {
    printSummary(cwd, scope);
  });
  program.command("new").description("Create a new agent-ready project from a supported template.").argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`).argument("[project-name]", "project folder name").action(async (template, projectName) => {
    applyWriteMode(program);
    await createNewProject({ template, projectName, cwd, options: program.opts() });
  });
  program.command("add").description("Add an AgentKick command/skill pack.").argument("<pack>", `pack: ${SUPPORTED_PACKS.join(", ")}`).action((pack) => {
    applyWriteMode(program);
    addPack(cwd, pack, program.opts());
  });
  return program;
}
async function run(argv, cwd = process2.cwd()) {
  const program = createProgram(cwd);
  await program.parseAsync(argv, { from: "user" });
}
async function createNewProject(input) {
  let template = input.template;
  let projectName = input.projectName;
  if (!template || !projectName) {
    if (!process2.stdin.isTTY || !process2.stdout.isTTY) {
      throw new Error("usage: agentkick new <template> <project-name>");
    }
    ({ template, projectName } = await promptForNewProject({ template, projectName }));
  }
  if (!isTemplate(template)) {
    throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
  }
  const projectDir = path5.resolve(input.cwd, projectName);
  if (fs4.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);
  const defaultPacks = defaultPacksForTemplate(template);
  const profile = { ...buildProfile(template, projectName), packs: ["core", ...defaultPacks] };
  writeTemplateProject(projectDir, profile);
  writeAgentFiles(projectDir, profile);
  writePack(projectDir, "core", profile, { updateConfig: false });
  for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });
  console.log(`Created ${projectName} using ${template}.`);
  if (input.options.dryRun) console.log("Dry run only. No files were written.");
  console.log("Next steps:");
  console.log(`  cd ${projectName}`);
  console.log("  agentkick doctor");
}
function initExistingProject(cwd, options) {
  const profile = detectProject(cwd);
  writeAgentFiles(cwd, profile);
  writePack(cwd, "core", profile);
  console.log(`Initialized AI-agent setup for ${profile.name}.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
  printDetectionSummary(profile);
}
function addPack(cwd, pack, options) {
  if (!isPack2(pack)) throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
  const profile = detectProject(cwd);
  writePack(cwd, pack, profile);
  console.log(`Added ${pack} pack.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
}
function printFocus(cwd, scope) {
  var _a;
  const profile = detectProject(cwd);
  const stack = profile.primaryStack ?? profile.template;
  const scopeLabel = scope ?? "current task";
  const candidates = ["AGENTS.md", "CLAUDE.md", ".agentkick.json", "package.json", "README.md", scope].filter(
    (item) => Boolean(item)
  );
  console.log("AgentKick focus");
  console.log("");
  console.log(`Scope: ${scopeLabel}`);
  console.log(`Detected stack: ${stack}`);
  if ((_a = profile.capabilities) == null ? void 0 : _a.length) console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  console.log("");
  console.log("Load first:");
  for (const item of uniqueExisting(cwd, candidates)) console.log(`- ${item}`);
  console.log("");
  console.log("Working rule: keep the agent context limited to the scope, touched files, and repo memory above.");
}
function printSummary(cwd, scope) {
  var _a;
  const profile = detectProject(cwd);
  console.log("AgentKick summary");
  console.log("");
  console.log(`Project: ${profile.name}`);
  if (scope) console.log(`Scope: ${scope}`);
  console.log(`Stack: ${profile.primaryStack ?? profile.template}`);
  if ((_a = profile.capabilities) == null ? void 0 : _a.length) console.log(`Capabilities: ${profile.capabilities.join(", ")}`);
  console.log(`Package manager: ${profile.packageManager}`);
  console.log(`Test: ${profile.testCommand}`);
  console.log(`Build: ${profile.buildCommand}`);
  console.log("");
  console.log("Recommended next step: run agentkick focus before giving a coding agent a new task.");
}
async function promptForNewProject(defaults) {
  const rl = readline.createInterface({ input: process2.stdin, output: process2.stdout });
  try {
    console.log("AgentKick project setup\n");
    SUPPORTED_TEMPLATES.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
    console.log("");
    const templateAnswer = defaults.template ?? await rl.question("Project type [1]: ");
    const template = resolveTemplateAnswer(templateAnswer || "1");
    const nameAnswer = defaults.projectName ?? await rl.question("Project name: ");
    const projectName = sanitizeProjectName(nameAnswer);
    if (!projectName) throw new Error("project name is required");
    return { template, projectName };
  } finally {
    rl.close();
  }
}
function resolveTemplateAnswer(answer) {
  const normalized = String(answer).trim();
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= SUPPORTED_TEMPLATES.length) {
    return SUPPORTED_TEMPLATES[numeric - 1];
  }
  if (isTemplate(normalized)) return normalized;
  throw new Error(`unknown template "${answer}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
}
function sanitizeProjectName(name) {
  return String(name ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
function printDetectionSummary(profile) {
  var _a;
  console.log(`Detected stack: ${profile.primaryStack ?? profile.template ?? "generic"}`);
  if ((_a = profile.capabilities) == null ? void 0 : _a.length) {
    console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  }
  if ((profile.primaryStack ?? profile.template) === "generic") {
    console.log("Could not confidently detect stack. Run agentkick doctor --debug to see checked files.");
  }
}
function applyWriteMode(program, options = {}) {
  const globalOptions = program.opts();
  setWriteMode({ dryRun: Boolean(options.dryRun ?? globalOptions.dryRun) });
}
function uniqueExisting(cwd, candidates) {
  return [...new Set(candidates)].filter((candidate) => fs4.existsSync(path5.join(cwd, candidate)));
}
function isTemplate(value) {
  return SUPPORTED_TEMPLATES.includes(value);
}
function isPack2(value) {
  return SUPPORTED_PACKS.includes(value);
}

// src/index.ts
run(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`agentkick failed: ${message}`);
  process.exitCode = 1;
});
//# sourceMappingURL=index.js.map