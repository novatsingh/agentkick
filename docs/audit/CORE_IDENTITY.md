# Core Identity

AgentKick must be easy to explain and hard to confuse with adjacent tools.

## Final Identity

```text
AgentKick is the workflow operating system for AI-native software development.
```

That means:

- repo-native
- CLI-first
- local-first
- workflow-focused
- memory-backed
- context-disciplined
- agent-compatible

## What AgentKick Does

AgentKick prepares a repository so coding agents can work with less confusion.

It:

- writes agent operating files
- creates persistent memory structure
- checks AI workflow readiness
- reduces context waste
- defines execution scope
- records task outcomes

## What AgentKick Does Not Do

AgentKick does not:

- search code semantically
- build vector indexes
- run a GraphRAG system
- replace Cursor, Codex, Claude Code, or Copilot
- become the coding agent
- host execution
- auto-refactor app code from heuristics

## The Distinction

```text
Repo-understanding tools explain codebases.
AgentKick structures AI workflows around repositories.
```

Keep this distinction everywhere.

## Core User Problem

Developers using AI coding tools repeatedly hit:

- context overflow
- giant AI chats
- temporary chat memory
- repeated repo explanations
- unscoped edits
- inconsistent verification
- lost continuity after reset

AgentKick solves the workflow layer of that problem.

## Product Wedge

The wedge is:

```bash
npx agentkick init
agentkick doctor
agentkick fix --plan
```

If this flow is excellent, AgentKick earns the right to add more.

## Core Product Objects

### Agent Files

Files that coding agents naturally read.

Examples:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/*`
- `.github/copilot-instructions.md`

### Memory Files

Durable project knowledge.

Examples:

- `.agentkick/memory/project.md`
- `.agentkick/memory/decisions.md`
- `.agentkick/memory/tasks.md`

### Context Manifest

Explicit context policy.

Examples:

- `.agentkick/context/manifest.json`
- `.agentkick/context/budgets.json`

### Doctor Findings

Actionable workflow health checks.

Examples:

- missing memory
- oversized context file
- stale task state
- unsafe MCP scope
- missing verification command

## Words To Prefer

Use:

- repo memory
- task scope
- context manifest
- Doctor finding
- agent operating file
- verification command
- safe fix plan

Avoid:

- intelligence layer
- autonomous platform
- AI brain
- semantic graph
- agent runtime
- universal automation

## Design Personality

AgentKick should feel:

- opinionated
- practical
- local
- reviewable
- infrastructure-grade
- calm

It should not feel:

- magical
- bloated
- dashboard-first
- buzzword-heavy
- cloud-dependent

## Unique Value

AgentKick makes the repo itself a better operating environment for coding agents.

That is the product.
