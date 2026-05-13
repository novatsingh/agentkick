# Simplification Plan

This plan reduces AgentKick to a focused, shippable workflow operating layer.

## Simplified Product Loop

Replace the many lifecycle diagrams with one loop:

```text
prepare -> focus -> execute -> verify -> record
```

### Prepare

Create or update repo operating files.

Commands:

- `agentkick init`
- `agentkick add <pack>`

### Focus

Select the task context and avoid irrelevant files.

Commands:

- `agentkick doctor`
- `agentkick focus`

### Execute

The coding agent works inside the scoped repo context.

AgentKick does not need to run the agent.

### Verify

Run documented commands.

Commands:

- project test/build commands
- `agentkick doctor --strict`

### Record

Write durable memory and task history.

Commands:

- `agentkick summarize`
- `agentkick memory validate`

## Simplified MVP Command Set

Keep:

```bash
agentkick new
agentkick init
agentkick add
agentkick doctor
agentkick fix --plan
agentkick fix --safe
agentkick focus
agentkick summarize
```

Postpone:

```bash
agentkick analyze
agentkick score
agentkick workflow-report
agentkick prepare-task
agentkick split-task
agentkick continue
agentkick workflow-state
agentkick plugin
```

Reason:

- `doctor` can include score and analysis at first.
- `focus` can cover basic task preparation.
- `summarize` can cover basic memory write-back.
- separate workflow commands create too much surface early.

## Simplified Memory Set

Required MVP files:

```text
AGENTS.md
WORKFLOW_RULES.md
.agentkick/memory/project.md
.agentkick/memory/decisions.md
.agentkick/memory/tasks.md
.agentkick/context/manifest.json
```

Optional files:

```text
ARCHITECTURE.md
FEATURE_SUMMARIES.md
API_CONTRACTS.md
DESIGN_SYSTEM.md
TASK_HISTORY.md
CURRENT_TASK.md
```

Rationale:

- too many root memory files will scare developers
- `.agentkick/memory/*` keeps the root clean
- optional files can appear when relevant

## Simplified Doctor

Doctor should start with five sections:

```text
Memory
Workflow
Context
Safety
Next fixes
```

Postpone the six-score suite.

Use one primary score:

```text
AI readiness: 84/100
```

Secondary details can be labels, not separate scores:

- context risk
- memory gap
- workflow gap
- safety risk

## Simplified Context Engine

MVP context engine should not model a workflow runtime.

It should:

- read `.agentkick/context/manifest.json`
- apply avoid-load rules
- include declared memory files
- include explicit task files/globs
- print the context package

It should not:

- infer semantic relevance
- build dependency graphs
- run agents
- manage parallel tasks
- coordinate multiple agents

## Simplified Package Structure

Stay single package.

Refactor internally:

```text
src/
  cli/
  config/
  fs/
  doctor/
  memory/
  context/
  templates/
  packs/
```

Postpone `packages/*` until the codebase needs it.

## Simplified Plugin Strategy

No plugin SDK in MVP.

Use built-in packs:

- core
- github
- security
- chrome-extension
- nextjs
- netlify

Later, extract plugin SDK from real pack needs.

## Simplified SaaS Strategy

No SaaS implementation before CLI adoption.

Keep only:

- Doctor JSON output
- CI-compatible output
- future upload format as a note

## Implementation Order

1. Add tests around current CLI.
2. Add `.agentkick/memory` scaffold.
3. Add `.agentkick/context/manifest.json`.
4. Upgrade Doctor checks.
5. Add `fix --plan` and `fix --safe`.
6. Add `focus`.
7. Add `summarize`.
8. Improve README and examples.

## Simplification Rule

If a feature does not improve one of these in the next 30 days, cut or postpone it:

- agent starts faster
- agent reads less
- agent verifies better
- task survives reset
- repo memory improves
- developer trusts the CLI more
