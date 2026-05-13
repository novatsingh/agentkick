# AgentKick

The missing workflow layer for AI-assisted development.

AgentKick makes your repo easier for Codex, Claude Code, Cursor, GitHub Copilot, Windsurf, and future coding agents to understand, follow, and verify.

It is not another coding agent. It is a local-first repo layer for agent instructions, reusable workflows, safety rules, and AI workflow readiness.

![AgentKick terminal demo](docs/assets/readme/agentkick-demo.gif)

## Install

```bash
npm install -g https://github.com/novatsingh/agentkick/archive/refs/heads/main.tar.gz
```

> npm package publishing is not live yet. Until the first npm release, install from the GitHub tarball instead of `npx agentkick`.

Requires Node.js 20 or newer.

## Quick Start

Run this inside any repo:

```bash
agentkick init
agentkick doctor
agentkick focus auth
agentkick summarize
```

That creates durable repo memory, checks AI workflow readiness, scopes a task, and prints a fresh-chat handoff summary.

## Why AgentKick Exists

AI coding starts fast, then breaks down when the repo has no durable operating memory.

Common failure modes:

- every agent needs the same project explanation again
- giant chats become the only source of task memory
- generated files and old artifacts waste context
- agents edit outside the intended scope
- verification steps are guessed or skipped
- handoffs vanish after a thread reset

AgentKick fixes the workflow layer around the repo so your existing agents can work with less confusion.

## What AgentKick Adds

![AgentKick repo layer](docs/assets/readme/repo-layer.svg)

AgentKick creates a small, reviewable repo operating layer:

- `AGENTS.md` for coding-agent operating rules
- `CLAUDE.md` for Claude Code project memory
- `.cursor/rules/*` for Cursor
- `.github/copilot-instructions.md` for GitHub Copilot
- `.codex/agents/*` and `.claude/*` for reusable specialist workflows
- `.agentkick.json` for project metadata
- `agentkick doctor` for AI workflow readiness checks

Everything is plain text. Everything is reviewable in Git.

## Current CLI Workflow

![AgentKick workflow loop](docs/assets/readme/workflow-loop.svg)

### `agentkick init`

Prepares an existing repo for AI-assisted development.

```bash
agentkick init
```

Creates agent files, project metadata, and reusable workflow rules. It should not touch application source files.

### `agentkick add`

Adds stack-specific workflow packs to an existing repo.

```bash
agentkick add security
agentkick add github
agentkick add chrome-extension
agentkick add netlify
```

Packs add focused instructions, commands, skills, and review workflows without turning AgentKick into a runtime.

### `agentkick doctor`

Finds workflow risks that make coding agents slower or less reliable.

```bash
agentkick doctor
agentkick doctor --strict
agentkick doctor --json
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
PASS Claude security skill: .claude/skills/security-scan/SKILL.md
PASS Codex reviewer agent: .codex/agents/reviewer.md
PASS Cursor rules: .cursor/rules/agentkick.mdc
PASS AgentKick config: .agentkick.json
```

### `agentkick new`

Creates an agent-ready starter project.

```bash
agentkick new chrome-extension browser-helper
agentkick new ai-saas myapp
agentkick new marketplace vendorhub
```

### `agentkick focus`

Creates scoped task context and updates `CURRENT_TASK.md` plus `.agentkick/workflow-state.json`.

```bash
agentkick focus auth
agentkick focus workflows
```

### `agentkick summarize`

Compresses current workflow state into a fresh-chat handoff summary.

```bash
agentkick summarize
agentkick summarize auth
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
- workflow packs are reusable
- agents share the same operating rules
- verification is easier to standardize

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

## What AgentKick Is Not

AgentKick is not:

- semantic search
- vector retrieval
- embeddings infrastructure
- GraphRAG
- a code indexing competitor
- a hosted coding agent
- a cloud runtime

AgentKick focuses on workflow structure, repo memory, and operating rules for AI-assisted development.

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

## Example Workflows

Prepare an existing app:

```bash
agentkick init
agentkick doctor --debug
agentkick focus checkout
```

Start a new AI SaaS project:

```bash
agentkick new ai-saas myapp
cd myapp
npm install
agentkick doctor
```

Reset a long agent thread:

```bash
agentkick summarize
```

Paste the fresh-chat summary into the next agent session.

## Templates

AgentKick can also create agent-ready starter projects:

```bash
agentkick new chrome-extension browser-helper
agentkick new ai-saas myapp
agentkick new saas dashboard
agentkick new marketplace vendorhub
agentkick new internal-tool ops-console
```

Supported templates:

- `chrome-extension`
- `ai-saas`
- `saas`
- `marketplace`
- `internal-tool`

Every template includes `AGENTS.md`, `CURRENT_TASK.md`, `ARCHITECTURE.md`, `FEATURE_SUMMARIES.md`, `WORKFLOW_RULES.md`, `DECISIONS.md`, `TASK_HISTORY.md`, a modular app structure, and starter verification commands.

## Packs

Packs add stack-specific workflow guidance to existing repos:

```bash
agentkick add security
agentkick add github
agentkick add chrome-extension
agentkick add netlify
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

See [docs/templates.md](docs/templates.md) and [docs/packs.md](docs/packs.md).

## Documentation

The architecture specs live under [`docs/`](docs/README.md).

- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Persistent memory](docs/memory/MEMORY_SYSTEM.md)
- [Doctor engine](docs/doctor/DOCTOR_ENGINE.md)
- [Context engine](docs/context-engine/CONTEXT_ENGINE.md)
- [Final MVP](docs/final-mvp/FINAL_MVP.md)

## Roadmap Snapshot

The next implementation pass is locked around:

- `agentkick split-task` for breaking broad AI requests into scoped chunks
- stronger template modularization
- package publishing readiness

These are documented in [Final MVP](docs/final-mvp/FINAL_MVP.md) and [CLI Execution Plan](docs/final-mvp/CLI_EXECUTION_PLAN.md).

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

## Development

```bash
npm install
npm test
npm run build
node dist/index.js doctor
```

On Windows:

```bash
npm.cmd test
```

Project structure:

- `src/core`: CLI program, config, and shared types
- `src/commands`: command registry and command handlers
- `src/detectors`: stack and capability detection
- `src/templates`: project templates and agent instruction renderers
- `src/workflow`: workflow packs
- `src/doctor`: AI-readiness audit
- `src/utils`: filesystem, logging, git, and formatting helpers

## License

MIT
