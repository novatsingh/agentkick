import { json, writeFile } from "./fs-utils.js";

export function writeAgentFiles(cwd, profile) {
  writeFile(cwd, "AGENTS.md", agentsMd(profile));
  writeFile(cwd, "CLAUDE.md", claudeMd(profile));
  writeFile(cwd, ".github/copilot-instructions.md", copilotInstructions(profile));
  writeFile(cwd, ".cursor/rules/agentkick.mdc", cursorRules(profile));
  writeFile(cwd, ".agentkick.json", json({
    schemaVersion: 1,
    name: profile.name,
    stack: profile.stack,
    packageManager: profile.packageManager,
    testCommand: profile.testCommand,
    buildCommand: profile.buildCommand,
    launchTarget: profile.launchTarget,
    packs: ["core"]
  }));
}

export function readmeFor(profile) {
  return `# ${titleize(profile.name)}

Generated with AgentKick.

## AI-Agent Ready

This repo includes:

- \`AGENTS.md\` for Codex and other coding agents
- \`CLAUDE.md\` for Claude Code
- \`.claude/commands\` reusable agent workflows
- \`.claude/agents\` specialist agents
- \`.cursor/rules\` for Cursor
- \`.github/copilot-instructions.md\` for GitHub Copilot

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

export function launchChecklist(profile) {
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

## Agent Operating Rules

- Understand the current code path before editing.
- Prefer small, reviewable changes over broad rewrites.
- Do not introduce secrets into committed files.
- Preserve existing user changes and do not revert unrelated work.
- After code edits, run the narrowest useful verification command.
- If verification cannot run, state the exact blocker.

## Commands

- Package manager: ${profile.packageManager}
- Test: ${profile.testCommand}
- Build: ${profile.buildCommand}
- Launch target: ${profile.launchTarget}

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
- Use specialist agents from \`.claude/agents\` for review, security, frontend, deploy, or stack-specific work.
- Keep final answers concise and include verification status.

## Project Facts

- Name: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Test command: ${profile.testCommand}
- Build command: ${profile.buildCommand}
- Launch target: ${profile.launchTarget}
`;
}

function copilotInstructions(profile) {
  return `# GitHub Copilot Instructions

Follow the repository rules in \`AGENTS.md\`.

- Keep changes small and consistent with the detected stack: ${profile.stack.join(", ") || "generic"}.
- Prefer existing scripts over new tooling.
- Do not add dependencies unless the task clearly requires them.
- Verify with: ${profile.testCommand}
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
  if (profile.stack.includes("chrome-extension")) notes.push("Chrome extension: preserve least-privilege manifest permissions and verify popup behavior in a constrained viewport.");
  if (profile.stack.includes("nextjs")) notes.push("Next.js: keep server/client component boundaries explicit and run a production build before shipping.");
  if (profile.stack.includes("netlify")) notes.push("Netlify: verify publish directory and build command from the site root before deploying.");
  if (profile.stack.includes("docker")) notes.push("Docker: avoid changing exposed ports, volumes, or environment contracts without documenting migration impact.");
  if (profile.stack.includes("python")) notes.push("Python: prefer existing dependency and formatting tools detected in the repo, and verify API behavior with pytest when available.");
  if (profile.stack.includes("fastapi")) notes.push("FastAPI: validate route schemas, status codes, and production server settings before shipping.");
  if (profile.stack.includes("flask")) notes.push("Flask: keep app factory patterns clean and avoid storing secrets in config defaults.");
  if (profile.stack.includes("laravel")) notes.push("Laravel: preserve framework conventions, review migrations carefully, and verify with php artisan test.");
  if (profile.stack.includes("go")) notes.push("Go: prefer explicit errors, table-driven tests, and go test ./... before releases.");
  if (profile.stack.includes("rust")) notes.push("Rust: avoid unsafe code unless justified and verify with cargo test before releases.");
  if (profile.stack.includes("electron")) notes.push("Electron: keep main, preload, and renderer boundaries strict; avoid broad IPC or Node access in renderer code.");
  if (notes.length === 0) notes.push("Generic: document missing commands before assuming test, build, or deploy behavior.");
  return notes;
}

function titleize(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
