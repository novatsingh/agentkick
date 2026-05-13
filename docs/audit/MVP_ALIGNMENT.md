# MVP Alignment

This document defines the simplified MVP after the architecture audit.

## MVP Goal

Make existing repos agent-ready in under five minutes.

## MVP User Flow

```bash
npx agentkick init
git diff
npx agentkick doctor
npx agentkick fix --plan
npx agentkick fix --safe
```

Optional:

```bash
agentkick focus --files src/app.ts
agentkick summarize --task "Fix checkout validation"
```

## MVP Must Have

### 1. Safe Repo Initialization

Required:

- detect stack
- generate agent files
- generate `.agentkick.json`
- preserve backups
- support dry run

### 2. Minimal Memory System

Required:

- `.agentkick/memory/project.md`
- `.agentkick/memory/decisions.md`
- `.agentkick/memory/tasks.md`
- memory map in `AGENTS.md`

Optional generated only when detected:

- `api-contracts.md`
- `design-system.md`
- `feature-summaries.md`

### 3. Doctor

Required:

- one readiness score
- missing file checks
- command checks
- memory checks
- context waste checks
- safety checks
- next fix recommendation

### 4. Safe Fix

Required:

- `fix --plan`
- `fix --safe`
- no app source refactors
- no destructive deletes
- backups before overwrites

### 5. Context Focus

Required:

- read context manifest
- print loaded files
- print avoided files
- accept explicit `--files`, `--feature`, or `--task`

### 6. Documentation

Required:

- clean README
- docs index
- examples
- product boundary
- contribution guide

## MVP Must Not Have

- SaaS dashboard
- plugin SDK
- marketplace
- VSCode extension
- multi-agent execution
- workflow studio
- semantic search
- vector search
- code graph infrastructure
- hosted execution
- automatic code refactors

## MVP Success Criteria

Developer can answer:

- What did AgentKick write?
- Why does this help coding agents?
- What should I fix next?
- What context should the agent read?
- What files should the agent avoid?

## MVP Technical Scope

Keep implementation inside one package.

Internal folders:

```text
src/
  cli/
  profile/
  writers/
  doctor/
  memory/
  context/
  packs/
```

No package workspace yet.

## MVP Doctor Output

Target output:

```text
AgentKick Doctor

AI readiness: 82/100 ready

Memory
  PASS AGENTS.md
  WARN .agentkick/memory/project.md missing

Workflow
  PASS test command documented
  WARN build command missing

Context
  WARN src/App.tsx is 920 lines
  PASS generated folders excluded

Safety
  PASS destructive action policy

Next
  agentkick fix --plan
```

## MVP Roadmap

### v0.2

- tests
- write plans
- config schema

### v0.3

- memory scaffold
- memory validation
- Doctor memory checks

### v0.4

- Doctor V2
- safe fix plans
- context waste checks

### v0.5

- context manifest
- `agentkick focus`
- `agentkick summarize`

## Alignment Rule

If a feature does not improve the first-run local CLI experience, it is not MVP.

AgentKick should become daily infrastructure one command at a time.
