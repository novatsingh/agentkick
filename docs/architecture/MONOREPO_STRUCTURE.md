# Monorepo Structure

AgentKick should evolve into a modular monorepo while preserving the current CLI as the fastest path to value.

The current repo is a compact Node CLI. The target structure separates product domains so memory, orchestration, context, doctor checks, templates, and agent renderers can scale independently.

## Target Layout

```text
agentkick/
  apps/
    docs/
    web/
    studio/
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
    telemetry/
  plugins/
    chrome-extension/
    nextjs/
    netlify/
    security/
    github/
    python/
    go/
    rust/
    electron/
  examples/
    chrome-extension/
    nextjs-saas/
    landing-page/
    node-cli/
  docs/
    architecture/
    product/
    plugin-authoring/
    workflow-design/
  scripts/
  tests/
    fixtures/
    integration/
    e2e/
```

## Package Responsibilities

### `packages/cli`

Command-line entry point.

Responsibilities:

- parse commands and flags
- call core operations
- format terminal output
- handle interactive prompts
- expose dry-run behavior
- return correct exit codes

The CLI should not own domain logic.

### `packages/core`

Domain model and operation planning.

Responsibilities:

- repo profile model
- operation plan model
- task model
- pack model
- generated file model
- safety policy model
- shared errors

Core should be dependency-light and usable by CLI, tests, SaaS workers, and future desktop tools.

### `packages/config`

Configuration loading, defaults, validation, and migrations.

Responsibilities:

- read `.agentkick/config.json`
- support legacy `.agentkick.json`
- validate schema versions
- apply default policies
- migrate older configs
- resolve installed pack and plugin metadata

### `packages/fs`

Safe filesystem operations.

Responsibilities:

- path normalization
- repo boundary enforcement
- dry-run file plans
- backup creation
- deterministic writes
- generated-file markers
- conflict detection

This package should be conservative because every higher-level command depends on it.

### `packages/memory`

Persistent project memory.

Responsibilities:

- memory schema definitions
- memory validation
- decision record helpers
- task summary writers
- memory compaction rules
- stale memory detection
- memory linting

Memory is file-based and version-controlled. This package should not require embeddings or vector infrastructure.

### `packages/context`

Context lifecycle and budget management.

Responsibilities:

- context manifests
- context budgets
- always-load rules
- task-load rules
- pack-specific context policies
- generated/vendor exclusion policies
- context preview output

This package helps users see what an agent should read before execution.

### `packages/orchestrator`

Task workflow engine.

Responsibilities:

- task classification
- workflow state machine
- task templates
- step validation
- verification requirements
- handoff summaries
- resumable task files

The orchestrator should produce clear task plans that any supported agent can execute.

### `packages/doctor`

AI-readiness audits.

Responsibilities:

- required file checks
- memory quality checks
- context budget checks
- command detection
- CI checks
- MCP/tool safety checks
- plugin-provided checks
- strict-mode scoring
- JSON output for automation

Doctor should explain what is missing and how to fix it.

### `packages/templates`

Project template registry.

Responsibilities:

- template manifests
- template file writers
- starter project fixtures
- template tests
- supported stack metadata

Templates create working projects plus AgentKick operating files.

### `packages/packs`

Official workflow packs.

Responsibilities:

- pack manifests
- generated commands
- generated skills
- specialist agent instructions
- doctor check additions
- context policies
- memory schema additions

Packs should be composable and auditable.

### `packages/plugin-sdk`

Plugin authoring API.

Responsibilities:

- plugin manifest schema
- contribution points
- validation helpers
- compatibility checks
- permission declarations
- plugin test harness

Plugins should declare their behavior rather than relying on hidden side effects.

### `packages/agent-interop`

Agent-specific renderers.

Responsibilities:

- Codex file rendering
- Claude Code file rendering
- Cursor rule rendering
- Copilot instruction rendering
- Windsurf support
- generic agent skill rendering
- capability mapping by agent

This package turns AgentKick's internal model into native agent surfaces.

### `packages/telemetry`

Optional local and hosted usage events.

Responsibilities:

- local run summaries
- anonymized command metrics when enabled
- doctor trend output
- SaaS sync event model

Telemetry must be optional and off by default for local-first usage.

## Apps

### `apps/docs`

Public documentation site.

Focus:

- install guide
- command reference
- architecture
- plugin authoring
- workflow examples

### `apps/web`

Future SaaS product.

Focus:

- team policy management
- pack marketplace
- organization dashboards
- doctor reporting
- memory review workflows

### `apps/studio`

Future local or desktop UI for workflow design.

Focus:

- task builder
- context preview
- memory editor
- doctor results
- plugin inspection

## Plugin Structure

```text
plugins/security/
  agentkick.plugin.json
  packs/
    security.json
  files/
    claude/
    codex/
    github/
  checks/
    secrets-policy.js
  memory/
    schema.json
  workflows/
    security-scan.json
  README.md
```

Plugins should be installable, inspectable, and removable.

## Generated Repo Structure

A repository initialized by AgentKick should converge toward:

```text
target-repo/
  AGENTS.md
  CLAUDE.md
  .agentkick/
    config.json
    memory/
      project.md
      architecture.md
      known-issues.md
      decisions/
      workflows/
      tasks/
    context/
      manifest.json
      budgets.json
    workflows/
    plugins/
      lock.json
  .agents/
    skills/
  .claude/
    commands/
    skills/
    agents/
  .codex/
    agents/
  .cursor/
    rules/
  .github/
    copilot-instructions.md
    instructions/
```

Root files provide agent compatibility. `.agentkick/` provides the durable source of truth.

## Migration From Current Repo

Current files map cleanly into future packages:

- `bin/agentkick.js` -> `packages/cli`
- `src/cli.js` -> `packages/cli`
- `src/profile.js` -> `packages/core`
- `src/fs-utils.js` -> `packages/fs`
- `src/doctor.js` -> `packages/doctor`
- `src/templates.js` -> `packages/templates`
- `src/packs.js` -> `packages/packs`
- `src/agent-files.js` -> `packages/agent-interop`
- `src/constants.js` -> `packages/config` and package manifests

The first migration should preserve behavior and only move boundaries after tests exist.

## Build And Test Strategy

Recommended tooling:

- TypeScript for package contracts.
- Vitest or Node test runner for unit tests.
- Fixture-based integration tests for generated repos.
- Snapshot tests for generated markdown where useful.
- End-to-end CLI tests for `new`, `init`, `add`, `doctor`, and migrations.

Generated output should be tested as product behavior.

## Release Strategy

Start as one npm package that publishes the CLI.

Then split internals behind stable package boundaries without forcing users to install multiple packages manually.

Long-term:

- `agentkick` remains the primary CLI package.
- internal packages can be published for plugin authors.
- official packs can ship inside the CLI first, then become individually versioned.
