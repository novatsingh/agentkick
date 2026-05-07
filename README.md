# AgentKick

AgentKick creates AI-agent-ready projects for Codex, Claude Code, Cursor, GitHub Copilot, OpenCode, Windsurf, and MCP-based workflows.

It is not another coding agent. It is the setup layer around coding agents.

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

```bash
agentkick new chrome-extension maps-lead-finder
agentkick new nextjs my-saas
agentkick new landing-page launch-site
agentkick new node-cli my-tool
```

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

## Product Positioning

`create-vite` starts a frontend app.

`agentkick new` starts an AI-agent-ready project.

`agentkick init` upgrades an existing repo so Codex, Claude, Cursor, and Copilot behave better.

## MVP Roadmap

- Interactive `agentkick new`
- More templates: FastAPI, Laravel, Electron, Supabase SaaS
- MCP config generator with safety presets
- Template marketplace
- README/demo generator for GitHub launch
- Star-growth checklist for open-source maintainers
