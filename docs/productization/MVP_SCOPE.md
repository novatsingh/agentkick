# MVP Scope

The MVP should be narrow, useful, and daily-adoptable.

AgentKick wins by making a repo easier for coding agents to work in today. It does not need a SaaS dashboard, embeddings, IDE extension, or autonomous multi-agent runtime to be valuable.

## MVP Promise

```text
Run AgentKick before AI agents touch your repo.
It creates the memory, workflow rules, and readiness checks agents need to work cleanly.
```

## Exact MVP

### Commands

- `agentkick new`
- `agentkick init`
- `agentkick add`
- `agentkick doctor`
- `agentkick doctor --json`
- `agentkick doctor --strict`
- `agentkick fix --plan`
- `agentkick fix --safe`
- `agentkick memory validate`
- `agentkick focus --task`

### Generated Repo Assets

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.github/instructions/*`
- `.cursor/rules/agentkick.mdc`
- `.claude/commands/*`
- `.claude/skills/*`
- `.codex/agents/*`
- `.agents/skills/*`
- `.agentkick.json`
- `.agentkick/memory/*`
- `.agentkick/context/manifest.json`
- `.agentkick/context/budgets.json`

### Doctor Checks

- required agent files
- memory coverage
- missing commands
- missing CI warning
- stale current task
- giant source files
- oversized React components
- generated/vendor context exposure
- raw logs in memory
- duplicate instruction warnings
- broad MCP/tool access warning

### Safe Fixes

- create missing memory files
- create missing context manifest
- add required memory sections
- add destructive action policy
- add memory update workflow section
- add generated/vendor avoid-load rules
- add README links to AgentKick docs when requested

### Templates

Keep current template set:

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

### Packs

Keep current pack set:

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

## What Not To Build Yet

Do not build:

- vector search
- embeddings
- semantic repo search
- GraphRAG
- hosted SaaS dashboard
- browser-based workflow studio
- VSCode extension
- marketplace
- autonomous background agents
- code refactor auto-fix
- team analytics
- payment system
- complex plugin runtime

These can come later only if they strengthen the workflow OS.

## MVP Developer Flow

```bash
npx agentkick init
npx agentkick doctor
npx agentkick fix --plan
npx agentkick fix --safe
```

Then:

```bash
agentkick add security
agentkick add github
agentkick doctor --strict
```

Expected experience:

- command runs quickly
- output explains what changed
- files are plain markdown and JSON
- user can inspect the diff
- coding agents have useful operating context

## MVP Success Metrics

Local metrics:

- fewer missing agent files
- Doctor readiness score improves after fixes
- memory scaffold exists
- context exclusions exist
- generated docs remain under size budgets

Adoption metrics:

- npm installs
- GitHub stars
- repos initialized
- templates generated
- Doctor runs
- issues from real users

Quality metrics:

- fixture tests pass
- generated output snapshots stable
- no destructive writes without backup
- no generated secrets

## MVP Anti-Goal

Do not try to automate all coding.

The MVP should make existing coding agents more reliable by giving repos memory, workflow structure, and context discipline.
