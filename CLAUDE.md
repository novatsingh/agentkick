# CLAUDE.md

This repository is configured for Claude Code.

## How To Work Here

- Start by reading `AGENTS.md`.
- Use project commands from `.claude/commands` when they match the task.
- Use playbooks from `.claude/skills` for review, debugging, tests, and security scans.
- Use specialist agents from `.claude/agents` for review, security, frontend, deploy, or stack-specific work.
- Preserve user changes. Do not overwrite files without considering ownership.
- Keep final answers concise and include verification status.

## Project Facts

- Name: agentkick
- Stack: node-cli
- Test command: npm test
- Build command: npm run build
- Launch target: GitHub

## Required Workflow

1. Inspect the relevant files before editing.
2. Make the smallest safe change.
3. Run the narrowest useful verification command.
4. Report any skipped verification with the exact reason.
