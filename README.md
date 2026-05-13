# AgentKick

Run AgentKick before AI agents touch your repo.

AgentKick turns repositories into AI-agent-native, production-safe, instruction-driven systems for Codex, Claude Code, Cursor, GitHub Copilot, OpenCode, Windsurf, and MCP-based workflows.

It is not another coding agent. It is the operating layer that makes coding agents behave like disciplined senior engineers.

AgentKick is not semantic search, vector retrieval, embeddings infrastructure, or a code indexing competitor. It is the workflow, memory, and context operating layer for AI-assisted software development.

```bash
npx agentkick new
```

Or run it directly with a template:

```bash
npx agentkick new chrome-extension maps-lead-finder
npx agentkick init
npx agentkick add security
npx agentkick doctor --strict
```

## Why

Most teams start with Codex or Claude from scratch, then the project becomes messy because the repo has no durable memory, scoped instructions, workflow standards, security boundaries, MCP safety rules, or testing conventions.

AgentKick gives every project a strong starting structure:

- `AGENTS.md` for Codex and other coding agents
- `CLAUDE.md` for Claude Code memory
- `.claude/commands` for reusable workflows
- `.claude/skills` for reusable Claude engineering playbooks
- `.claude/agents` for specialist agents
- `.agents/skills` for reusable multi-agent skills
- `.codex/agents` for Codex specialist agents
- `.cursor/rules` for Cursor
- `.github/copilot-instructions.md` for GitHub Copilot
- `.github/instructions/*` for path-specific Copilot rules
- `.agentkick.json` for project metadata

## Documentation

The architecture specs live under [`docs/`](docs/README.md) so the repo root stays focused on the product and CLI.

- [Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Persistent memory](docs/memory/MEMORY_SYSTEM.md)
- [Doctor engine](docs/doctor/DOCTOR_ENGINE.md)
- [Context engine](docs/context-engine/CONTEXT_ENGINE.md)
- [Roadmap](docs/architecture/ROADMAP.md)

## Commands

Interactive project setup:

```bash
agentkick new
```

Direct project creation:

```bash
agentkick new chrome-extension maps-lead-finder
agentkick new nextjs my-saas
agentkick new fastapi my-api
agentkick new go-cli my-tool
agentkick new landing-page launch-site
agentkick new node-cli my-tool
```

Upgrade an existing repo:

```bash
cd existing-repo
agentkick init
agentkick add security
agentkick add netlify
agentkick doctor
agentkick doctor --strict
agentkick doctor --json
agentkick init --dry-run
```

## Templates

- `chrome-extension`
- `nextjs`
- `landing-page`
- `node-cli`
- `fastapi`
- `flask`
- `laravel`
- `go-cli`
- `rust-cli`
- `electron`

## Packs

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

See [docs/templates.md](docs/templates.md) and [docs/packs.md](docs/packs.md) for details.

## Product Positioning

`create-vite` starts a frontend app.

`agentkick new` starts an AI-agent-ready project.

`agentkick init` upgrades an existing repo so Codex, Claude, Cursor, and Copilot behave better.

AgentKick is the repo intelligence layer between raw codebases and autonomous coding agents. See the full [roadmap](docs/architecture/ROADMAP.md) for the platform direction.

## Development

```bash
npm install
npm test
node bin/agentkick.js new landing-page demo-site
```

## Project Structure

- `bin/agentkick.js`: tiny executable wrapper.
- `src/cli.js`: command routing and interactive prompts.
- `src/profile.js`: stack detection and project profile generation.
- `src/templates.js`: project template writers.
- `src/packs.js`: command-pack and specialist-agent writers.
- `src/agent-files.js`: `AGENTS.md`, `CLAUDE.md`, skills, agents, Cursor, and Copilot instruction renderers.
- `src/doctor.js`: scored AI-readiness audit with strict and JSON output.
- `scripts/check.js`: syntax checks for all JavaScript source files.

## File Safety

AgentKick preserves a `.agentkick-backup` copy before updating an existing file with different content.

Use dry-run mode to preview writes:

```bash
agentkick init --dry-run
agentkick add security --dry-run
agentkick new fastapi demo-api --dry-run
```
