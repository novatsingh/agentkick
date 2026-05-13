# CLI Commands

The AgentKick CLI should feel fast, precise, and calm.

It is the local control plane for AI-native workflow infrastructure.

## Terminal UX Philosophy

- No noisy banners.
- Show what changed.
- Show why it matters.
- Show next command.
- Prefer tables only when they improve scanning.
- Use dry-run and plan-first output before risky writes.
- Never hide skipped verification.
- Never bury critical findings under generic advice.

## Command Families

### Project Setup

```bash
agentkick new [template] [name]
agentkick init
agentkick add <pack>
```

Purpose:

- create agent-ready projects
- upgrade existing repos
- add workflow packs

### Readiness

```bash
agentkick doctor
agentkick doctor --strict
agentkick doctor --json
agentkick analyze
agentkick score
agentkick workflow-report
```

Purpose:

- inspect AI workflow health
- score readiness
- find context waste
- explain execution risks

### Fixes

```bash
agentkick fix --plan
agentkick fix --safe
agentkick fix --interactive
```

Purpose:

- scaffold missing memory
- repair workflow structure
- add context exclusions
- never auto-refactor source code

### Memory

```bash
agentkick memory init
agentkick memory validate
agentkick memory compact
agentkick memory add-decision
agentkick memory summarize-task
```

Purpose:

- manage persistent project memory
- validate file conventions
- compact history

### Context

```bash
agentkick focus
agentkick focus --task TASK-123
agentkick focus --feature billing
agentkick reset-context
agentkick compact
```

Purpose:

- prepare focused context packages
- reduce active context load
- reset long threads safely

### Task Orchestration

```bash
agentkick prepare-task "Fix billing retry bug"
agentkick split-task TASK-123
agentkick continue TASK-123
agentkick workflow-state
```

Purpose:

- make work resumable
- split broad tasks
- hand off between agents

### Plugins

```bash
agentkick plugin list
agentkick plugin validate
agentkick plugin add <source>
agentkick plugin remove <name>
```

Purpose:

- inspect and install workflow extensions

## Interaction Patterns

### Plan-First Writes

```text
AgentKick Fix

Plan only. No files changed.

Will create
  .agentkick/memory/project.md
  .agentkick/context/manifest.json

Will update
  AGENTS.md add Memory Map

Apply
  agentkick fix --safe
```

### Score Output

```text
AgentKick Doctor

AI readiness: 84/100 ready

Strong
  workflow rules
  agent files
  safe write policy

Needs focus
  missing API_CONTRACTS.md
  src/App.tsx is context-heavy

Next
  agentkick fix --plan
```

### Context Output

```text
AgentKick Focus

Task
  TASK-123 Fix trial popup error handling

Loaded
  P0 AGENTS.md
  P1 popup feature memory
  P2 src/popup.js

Avoided
  background/**
  dist/**
  node_modules/**
```

## Exit Codes

```text
0 success
1 strict gate failed
2 invalid command or config
3 unsafe operation blocked
4 plugin validation failed
5 filesystem write failed
```

## CLI Standard

Every command should answer:

- what did AgentKick inspect?
- what did it change?
- why does it matter for agents?
- what should the developer run next?
