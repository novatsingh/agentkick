import { json, writeFile } from "../utils/fs.js";
import type { ProjectProfile } from "../core/types.js";

export function writeAgentFiles(cwd: string, profile: ProjectProfile) {
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

export function readmeFor(profile: ProjectProfile) {
  return `# ${titleize(profile.name)}

Generated with AgentKick.

## AI-Agent Ready

This repo includes:

- \`AGENTS.md\` for Codex and other coding agents
- \`CURRENT_TASK.md\` for active execution state
- \`ARCHITECTURE.md\` for repo boundaries and ownership
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

export function launchChecklist(profile: ProjectProfile) {
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

function agentsMd(profile: ProjectProfile) {
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

${stackNotes(profile)
  .map((note) => `- ${note}`)
  .join("\n")}
`;
}

function claudeMd(profile: ProjectProfile) {
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

function copilotInstructions(profile: ProjectProfile) {
  return `# GitHub Copilot Instructions

Follow the repository rules in \`AGENTS.md\`.

- Keep changes small and consistent with the detected stack: ${profile.stack.join(", ") || "generic"}.
- Prefer existing scripts over new tooling.
- Do not add dependencies unless the task clearly requires them.
- Validate external input and avoid leaking secrets.
- Verify with: ${profile.testCommand}
`;
}

function writeGithubInstructions(cwd: string, profile: ProjectProfile) {
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

function writeClaudeSkills(cwd: string, profile: ProjectProfile) {
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

function writeGenericSkills(cwd: string, profile: ProjectProfile) {
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

function writeCodexAgents(cwd: string, profile: ProjectProfile) {
  const agents = {
    reviewer: "Review diffs for bugs, regressions, missing tests, and security risks. Do not rewrite code.",
    "test-writer": `Add focused tests using existing conventions. Verify with ${profile.testCommand}.`,
    "migration-expert":
      "Review schema, dependency, or framework migrations. Call out rollback and compatibility risks.",
    "docs-researcher": "Research documentation gaps and update repo docs without changing product behavior.",
    "performance-optimizer": "Optimize only measured bottlenecks. Preserve behavior and add verification notes."
  };
  for (const [name, purpose] of Object.entries(agents)) {
    writeFile(cwd, `.codex/agents/${name}.md`, codexAgent(name, purpose, profile));
  }
}

function githubInstruction(name: string, applyTo: string, rules: string[]) {
  return `---
applyTo: "${applyTo}"
---

# ${name} instructions

${rules.map((rule) => `- ${rule}`).join("\n")}
`;
}

function skillMarkdown(name: string, steps: string[]) {
  return `---
description: ${name.replace(/-/g, " ")} workflow for disciplined AI coding agents.
---

# ${name}

${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`;
}

function codexAgent(name: string, purpose: string, profile: ProjectProfile) {
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

function cursorRules(profile: ProjectProfile) {
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

function stackNotes(profile: ProjectProfile) {
  const notes: string[] = [];
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

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
