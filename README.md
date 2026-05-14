# AgentKick

Make any repo AI-agent-ready in under five minutes.

AgentKick is not another coding agent. It is a local-first repo readiness layer that prepares projects for Codex, Claude Code, Cursor, GitHub Copilot, Windsurf, and MCP-based workflows.

It creates durable repo memory, agent operating rules, scoped task context, and fresh-chat handoffs so coding agents can enter a repo faster, stay inside the right scope, and verify work more consistently.

![AgentKick terminal demo](docs/assets/readme/agentkick-demo.gif)

## Install

```bash
npm install -g https://github.com/novatsingh/agentkick/archive/refs/heads/main.tar.gz
```

> npm package publishing is not live yet. Until the first npm release, install from the GitHub tarball instead of `npx agentkick`.

Requires Node.js 20 or newer.

## Five-Minute Workflow

Run this inside an existing repo:

```bash
agentkick init
agentkick doctor
agentkick focus auth
agentkick split-task "add checkout and dashboard"
agentkick summarize
```

What happens:

- `init` writes reviewable agent instructions and repo memory files.
- `doctor` checks whether the repo is ready for AI-assisted development.
- `focus auth` creates scoped task context for one feature or task.
- `split-task` breaks broad AI requests into scoped execution chunks.
- `summarize` prints a compact fresh-chat handoff for the next agent session.

```text
prepare repo -> diagnose risk -> focus task -> hand off cleanly
```

## Who This Is For

- Developers using Codex, Cursor, Claude Code, Copilot, Windsurf, or MCP-based agent workflows.
- Teams losing important project context inside long AI chats.
- Maintainers who want AI workflow rules stored as reviewable repo files.

## Why AgentKick Exists

AI coding starts fast, then breaks down when chat history becomes the only source of project memory.

Common failure modes:

- every agent needs the same project explanation again
- giant chats become the only place task context lives
- generated files and old artifacts waste context
- agents edit outside the intended scope
- verification steps are guessed or skipped
- handoffs vanish after a thread reset

AgentKick fixes the workflow layer around the repo so your existing agents can work with less confusion.

## What AgentKick Adds

![AgentKick repo layer](docs/assets/readme/repo-layer.svg)

AgentKick creates a small, reviewable repo operating layer:

- `AGENTS.md` for coding-agent operating rules
- `CURRENT_TASK.md` for active scope and verification state
- `ARCHITECTURE.md`, `FEATURE_SUMMARIES.md`, `DECISIONS.md`, and `TASK_HISTORY.md` for durable repo memory
- `WORKFLOW_RULES.md` for context-loading and update discipline
- `.agentkick.json` and `.agentkick/workflow-state.json` for project metadata and current workflow state
- `.cursor/rules/*`, `.github/copilot-instructions.md`, `.codex/agents/*`, and `.claude/*` for agent-specific guidance
- `agentkick doctor` for AI workflow readiness checks

Everything is plain text or JSON. Everything is reviewable in Git.

## Core Commands

![AgentKick workflow loop](docs/assets/readme/workflow-loop.svg)

### `agentkick init`

Prepares an existing repo for AI-assisted development.

```bash
agentkick init
agentkick init --dry-run
```

Creates agent files, project metadata, workflow memory, and reusable operating rules. It should not touch application source files.

### `agentkick doctor`

Finds workflow risks that make coding agents slower or less reliable.

```bash
agentkick doctor
agentkick doctor --strict
agentkick doctor --json
agentkick doctor --debug
```

Example output:

```text
AgentKick doctor

AI Readiness Score: 100/100
Status: ready

Detected stack:
- nextjs
- react
- tailwind

PASS master repo intelligence: AGENTS.md
PASS Claude memory: CLAUDE.md
PASS Copilot root instructions: .github/copilot-instructions.md
PASS Cursor rules: .cursor/rules/agentkick.mdc
PASS AgentKick config: .agentkick.json
```

### `agentkick focus`

Creates scoped task context and updates `CURRENT_TASK.md` plus `.agentkick/workflow-state.json`.

```bash
agentkick focus auth
agentkick focus --feature billing
agentkick focus --task "Improve README positioning"
agentkick focus --files README.md package.json
agentkick focus checkout
agentkick focus "fix popup button"
```

Focus output is a paste-ready task brief for Codex, Claude Code, Cursor, Copilot, Windsurf, or MCP-based workflows. It tells the next coding agent the task, files to read first, task files, avoid paths, memory files, verification command, boundaries, uncertainty, and the next AgentKick command.

Before Codex:

```bash
agentkick focus --task "Improve README positioning"
```

Or, when you already know the scope:

```bash
agentkick focus --files README.md package.json
```

### `agentkick split-task`

Turns a broad AI coding request into 2-5 scoped execution chunks without calling an LLM or writing files.

```bash
agentkick split-task "Add paid checkout and dashboard"
agentkick split-task "Add paid checkout and dashboard" --files src/app.ts src/billing.ts
agentkick split-task "Improve extension popup" --json
```

Example output:

```text
AgentKick split-task

Task: Add paid checkout and dashboard

Suggested execution:
1. [do first] Implement billing or checkout flow
   Scope: billing, checkout, plans, payments, subscriptions
   Suggested files: src/billing.ts
   Verification: npm run check

2. Update dashboard experience (parallelizable)
   Scope: dashboard, reports, settings, account workspace
   Suggested files: src/app.ts
   Verification: npm run check

Next: agentkick focus billing
```

### `agentkick summarize`

Compresses current workflow state into a fresh-chat handoff summary.

```bash
agentkick summarize
agentkick summarize --task "Improve README positioning"
agentkick summarize --task "Improve README positioning" --handoff
agentkick summarize auth
```

Use this after Codex or another coding agent finishes a pass. It appends a compact task entry to `TASK_HISTORY.md` and can print a short fresh-chat handoff.

After Codex:

```bash
agentkick summarize --task "Improve README positioning" --handoff
```

## Before And After

![Before and after AgentKick](docs/assets/readme/before-after.svg)

Before AgentKick:

- repo knowledge lives in chat history
- agents load too much context
- task scope is vague
- verification is inconsistent

After AgentKick:

- agent rules live in files
- workflow memory is reusable
- agents share the same operating rules
- focused tasks are easier to hand off

## Works With Your Agent

![Agent compatibility](docs/assets/readme/agent-compatibility.svg)

AgentKick is designed for:

- Codex
- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- MCP-based workflows
- future autonomous coding agents

AgentKick does not replace those tools. It gives them a better repo operating layer.

## What AgentKick Does Not Do

AgentKick does not:

- run a hosted coding agent
- upload your repo
- create a vector database
- use embeddings or GraphRAG
- automatically refactor source code from `doctor`
- replace your existing editor, agent, test runner, or CI

AgentKick focuses on workflow structure, repo memory, task context, and operating rules for AI-assisted development.

## Generated Files

Current generated repo layer:

```text
AGENTS.md
CLAUDE.md
CURRENT_TASK.md
ARCHITECTURE.md
FEATURE_SUMMARIES.md
WORKFLOW_RULES.md
DECISIONS.md
TASK_HISTORY.md
.agentkick.json
.agentkick/workflow-state.json
.cursor/rules/*
.github/copilot-instructions.md
.github/instructions/*
.codex/agents/*
.claude/commands/*
.claude/skills/*
.claude/agents/*
.agents/skills/*
```

These files are plain markdown and JSON so every change is visible in `git diff`.

## Local-First Safety

AgentKick is built to be safe to run in real repos:

- no account required
- no repo upload required
- no source-code auto-refactors from Doctor
- write plans before risky changes
- backups before overwrites
- plain files you can inspect with `git diff`

Preview writes:

```bash
agentkick init --dry-run
agentkick add security --dry-run
agentkick new ai-saas demo-app --dry-run
```

## Secondary Capabilities

The launch identity is existing-repo readiness: `init`, `doctor`, `focus`, and `summarize`.

AgentKick also includes scaffolding and workflow-pack commands for teams that want them.

### `agentkick new`

Creates an agent-ready starter project.

```bash
agentkick new chrome-extension browser-helper
agentkick new ai-saas myapp
agentkick new saas dashboard
agentkick new marketplace vendorhub
agentkick new internal-tool ops-console
agentkick new electron-app desktop-studio
agentkick new tauri-app native-studio
```

Supported templates:

- `chrome-extension`
- `ai-saas`
- `saas`
- `marketplace`
- `internal-tool`
- `electron-app`
- `tauri-app`

Every template includes agent memory files, workflow rules, modular source boundaries, and starter verification commands.

### `agentkick add`

Adds stack-specific workflow guidance to an existing repo.

```bash
agentkick add security
agentkick add github
agentkick add chrome-extension
agentkick add netlify
agentkick add electron
agentkick add tauri
```

Supported packs:

- `core`
- `chrome-extension`
- `nextjs`
- `netlify`
- `security`
- `github`
- `python`
- `php`
- `go`
- `rust`
- `electron`
- `tauri`

See [docs/templates.md](docs/templates.md) and [docs/packs.md](docs/packs.md).

## Example Workflows

Prepare an existing app:

```bash
agentkick init
agentkick doctor --debug
agentkick focus checkout
```

Reset a long agent thread:

```bash
agentkick summarize
```

Paste the fresh-chat summary into the next agent session.

Start a new desktop app:

```bash
agentkick new electron-app desktop-studio
cd desktop-studio
npm install
npm run dev
```

For a smaller native desktop app, use `agentkick new tauri-app native-studio`. Tauri requires Rust and system setup before `npm run dev` or `npm run build`.

## Documentation

The architecture specs live under [`docs/`](docs/README.md).

- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Persistent memory](docs/memory/MEMORY_SYSTEM.md)
- [Doctor engine](docs/doctor/DOCTOR_ENGINE.md)
- [Context engine](docs/context-engine/CONTEXT_ENGINE.md)
- [Final MVP](docs/final-mvp/FINAL_MVP.md)
- [Release checklist](docs/release.md)

## Roadmap Snapshot

Near-term roadmap:

- package publishing readiness
- tighter tests around release packaging and generated templates

These are documented in [Final MVP](docs/final-mvp/FINAL_MVP.md) and [CLI Execution Plan](docs/final-mvp/CLI_EXECUTION_PLAN.md).

## Development

```bash
npm install
npm run check
npm run build
npm run smoke
node dist/index.js doctor
```

On Windows:

```bash
npm.cmd run check
```

Project structure:

- `src/core`: CLI program, config, and shared types
- `src/commands`: command registry and command handlers
- `src/detectors`: stack and capability detection
- `src/templates`: project templates and agent instruction renderers
- `src/workflow`: workflow memory, focus, summarize, and packs
- `src/doctor`: AI-readiness audit
- `src/utils`: filesystem, logging, git, and formatting helpers

## License

MIT
