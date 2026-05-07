# AgentKick

Kickstart projects that are ready for Codex, Claude Code, Cursor, GitHub Copilot, OpenCode, Windsurf, and MCP-based workflows.

It is not another coding agent. It is the setup layer around coding agents.

```bash
npx agentkick new
```

Or run it directly with a template:

```bash
npx agentkick new chrome-extension maps-lead-finder
npx agentkick init
npx agentkick add security
npx agentkick doctor
```

## Why

Most people start with Codex or Claude from scratch, then the project becomes messy because the agent has no durable repo instructions, commands, safety rules, or launch checklist.

AgentKick gives every project a strong starting structure:

- `AGENTS.md` for Codex and other coding agents
- `CLAUDE.md` for Claude Code memory
- `.claude/commands` for reusable workflows
- `.claude/agents` for specialist agents
- `.cursor/rules` for Cursor
- `.github/copilot-instructions.md` for GitHub Copilot
- `.agentkick.json` for project metadata

## Commands

Interactive project setup:

```bash
agentkick new
```

Direct project creation:

```bash
agentkick new chrome-extension maps-lead-finder
agentkick new nextjs my-saas
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
```

## Templates

- `chrome-extension`
- `nextjs`
- `landing-page`
- `node-cli`

## Packs

- `core`
- `chrome-extension`
- `nextjs`
- `netlify`
- `security`
- `github`

See [docs/templates.md](docs/templates.md) and [docs/packs.md](docs/packs.md) for details.

## Product Positioning

`create-vite` starts a frontend app.

`agentkick new` starts an AI-agent-ready project.

`agentkick init` upgrades an existing repo so Codex, Claude, Cursor, and Copilot behave better.

## MVP Roadmap

- More templates: FastAPI, Laravel, Electron, Supabase SaaS
- MCP config generator with safety presets
- Template marketplace
- README/demo generator for GitHub launch
- Star-growth checklist for open-source maintainers

## Development

```bash
npm install
npm test
node bin/agentkick.js new landing-page demo-site
```
