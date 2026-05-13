# Package Breakdown

AgentKick should ship as one CLI package first, then evolve into internal packages behind stable boundaries.

The public install remains simple:

```bash
npx agentkick
```

## Phase 1 Package Shape

Single npm package:

```text
agentkick/
  bin/
  src/
  docs/
  scripts/
```

Keep this shape until tests and schemas are stable.

## Phase 2 Internal Boundaries

Move modules inside `src/` first:

```text
src/
  cli/
  core/
  config/
  fs/
  doctor/
  memory/
  context/
  orchestrator/
  templates/
  packs/
  interop/
  plugins/
```

This gets architecture discipline without monorepo overhead.

## Phase 3 Workspace Packages

Move to packages only when needed:

```text
packages/
  cli/
  core/
  config/
  fs/
  memory/
  context/
  orchestrator/
  doctor/
  templates/
  packs/
  plugin-sdk/
  agent-interop/
```

## Package Responsibilities

### `@agentkick/cli`

- command parsing
- terminal output
- prompts
- exit codes
- command routing

### `@agentkick/core`

- repo profile
- operation plans
- task model
- finding model
- score model
- shared types

### `@agentkick/config`

- `.agentkick.json`
- `.agentkick/config.json`
- schema validation
- migrations

### `@agentkick/fs`

- safe writes
- backups
- dry-run plans
- path guards
- generated section updates

### `@agentkick/memory`

- memory templates
- memory validation
- stale checks
- compaction
- decision records

### `@agentkick/context`

- context manifests
- budgets
- focus packages
- avoid-load policies

### `@agentkick/orchestrator`

- task state
- workflow state machine
- handoff summaries
- task decomposition

### `@agentkick/doctor`

- readiness checks
- scoring
- findings
- fix plans
- JSON output

### `@agentkick/templates`

- starter projects
- template manifests
- generated fixture tests

### `@agentkick/packs`

- official packs
- stack workflows
- pack manifests

### `@agentkick/plugin-sdk`

- plugin schema
- contribution points
- validation harness

### `@agentkick/agent-interop`

- Codex rendering
- Claude Code rendering
- Cursor rendering
- Copilot rendering
- Windsurf rendering

## Complexity Estimates

```text
cli                 low
fs safety            medium
config schemas       medium
doctor scoring       medium-high
memory validation    medium
context focus        high
orchestrator         high
plugin SDK           high
agent interop        medium
templates            medium
```

## Package Rule

Do not split packages for aesthetics.

Split when:

- tests need isolation
- plugin authors need a public API
- SaaS needs to reuse core logic
- package boundaries reduce real complexity
