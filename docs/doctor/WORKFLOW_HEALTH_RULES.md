# Workflow Health Rules

Workflow health rules define what AgentKick Doctor checks when evaluating AI-native development quality.

These rules are not generic lint rules. They identify conditions that make coding agents waste tokens, lose continuity, over-edit, skip verification, or misunderstand a repo.

## Rule Format

Each rule should define:

```text
id
category
priority
signal
agent impact
recommendation
auto-fix level
score impact
```

Auto-fix levels:

```text
safe       AgentKick can apply with low risk
plan       AgentKick can generate a proposed patch or scaffold
manual     requires human or agent implementation work
none       report only
```

## Rule Categories

```text
memory
context
workflow
isolation
maintainability
continuity
safety
```

## Memory Rules

### `memory.agents-missing`

Signal:

- `AGENTS.md` missing or too small.

Impact:

- agents lack a stable operating entry point.

Recommendation:

- run `agentkick init` or `agentkick fix --safe`.

Priority: P0.

Auto-fix: safe.

### `memory.workflow-rules-missing`

Signal:

- `WORKFLOW_RULES.md` missing.

Impact:

- agents improvise test, review, memory update, and release behavior.

Recommendation:

- scaffold workflow rules from detected stack.

Priority: P1.

Auto-fix: safe.

### `memory.feature-summaries-missing`

Signal:

- product or frontend repo has feature directories but no `FEATURE_SUMMARIES.md`.

Impact:

- agents rediscover product behavior from code.

Recommendation:

- create feature index and summarize active features.

Priority: P1.

Auto-fix: plan.

### `memory.api-contracts-missing`

Signal:

- API routes, service clients, schemas, or handlers exist but no `API_CONTRACTS.md`.

Impact:

- agents may break client/server compatibility.

Recommendation:

- create API contract file with detected endpoint placeholders.

Priority: P1.

Auto-fix: plan.

### `memory.current-task-stale`

Signal:

- `CURRENT_TASK.md` exists, is not completed, and is older than threshold.

Impact:

- new agents may continue obsolete work.

Recommendation:

- mark complete, refresh, or archive.

Priority: P2.

Auto-fix: plan.

### `memory.history-over-budget`

Signal:

- `TASK_HISTORY.md` exceeds configured line budget.

Impact:

- continuity memory becomes active context waste.

Recommendation:

- compact old entries into monthly summaries.

Priority: P2.

Auto-fix: plan.

## Context Rules

### `context.giant-file`

Signal:

- source file exceeds line threshold and is not generated.

Impact:

- agents must load too much unrelated code for small tasks.

Recommendation:

- split by responsibility and document boundary.

Priority: P1.

Auto-fix: manual.

### `context.oversized-react-component`

Signal:

- component file exceeds component threshold or mixes UI, state, data access, and routing.

Impact:

- UI tasks become context-heavy and fragile.

Recommendation:

- extract route shell, state hook, API client usage, and presentational pieces.

Priority: P1.

Auto-fix: manual.

### `context.generated-exposure`

Signal:

- default context includes `dist`, `build`, `coverage`, `node_modules`, generated assets, or lockfile internals.

Impact:

- agents waste context on non-source artifacts.

Recommendation:

- add avoid-load rules to context manifest.

Priority: P1.

Auto-fix: safe.

### `context.raw-log-memory`

Signal:

- memory files contain long command outputs, stack traces, or transcript blocks.

Impact:

- agents load historical noise instead of durable facts.

Recommendation:

- compress logs into outcome, root cause, and verification.

Priority: P2.

Auto-fix: plan.

### `context.instructions-duplicated`

Signal:

- same operating rules repeated across multiple agent files without source-of-truth marker.

Impact:

- instruction drift and token waste.

Recommendation:

- centralize stable rules in `AGENTS.md` and render agent-specific summaries.

Priority: P2.

Auto-fix: plan.

## Workflow Rules

### `workflow.test-command-missing`

Signal:

- no test command in package scripts, memory, or AgentKick config.

Impact:

- agents cannot verify behavior consistently.

Recommendation:

- document the narrowest useful test command.

Priority: P1.

Auto-fix: plan.

### `workflow.build-command-missing`

Signal:

- buildable repo has no build command documented.

Impact:

- agents may ship changes without production validation.

Recommendation:

- document build command or explain why none exists.

Priority: P2.

Auto-fix: plan.

### `workflow.memory-update-missing`

Signal:

- workflow rules do not define when to update memory.

Impact:

- durable knowledge stays in chat and disappears after reset.

Recommendation:

- add memory update workflow.

Priority: P1.

Auto-fix: safe.

### `workflow.verification-broad`

Signal:

- only full-suite verification exists for a large repo.

Impact:

- agents skip verification or waste time on unrelated failures.

Recommendation:

- document narrow checks by package, feature, or file type.

Priority: P2.

Auto-fix: manual.

## Isolation Rules

### `isolation.current-task-missing`

Signal:

- active work is detected but no `CURRENT_TASK.md` or task manifest exists.

Impact:

- thread reset loses execution state.

Recommendation:

- create current task file with goal, scope, plan, blockers, and verification.

Priority: P1.

Auto-fix: plan.

### `isolation.feature-spill`

Signal:

- one feature appears to span many unrelated directories without feature memory.

Impact:

- agents cannot safely bound changes.

Recommendation:

- add feature-scoped memory and clarify ownership boundaries.

Priority: P1.

Auto-fix: plan.

### `isolation.global-state-coupling`

Signal:

- unrelated features depend on shared mutable state or broad context providers.

Impact:

- small changes create cross-feature risk.

Recommendation:

- document state ownership and split feature state where possible.

Priority: P1.

Auto-fix: manual.

## Maintainability Rules

### `maintainability.unclear-folders`

Signal:

- top-level source folders use vague or inconsistent names.

Impact:

- agents waste cycles finding ownership areas.

Recommendation:

- document folder meaning in `ARCHITECTURE.md` or normalize names.

Priority: P2.

Auto-fix: plan.

### `maintainability.duplicated-business-logic`

Signal:

- repeated validation, transformation, permission, or pricing logic patterns.

Impact:

- agents fix one copy and miss others.

Recommendation:

- consolidate logic or document intentional duplication.

Priority: P1.

Auto-fix: manual.

### `maintainability.massive-dependency-chain`

Signal:

- common task path imports many layers before reaching behavior.

Impact:

- agents need broad context to assess local changes.

Recommendation:

- introduce clearer boundaries or document chain in architecture memory.

Priority: P2.

Auto-fix: manual.

## Continuity Rules

### `continuity.task-history-missing`

Signal:

- AgentKick memory exists but no task history after repeated changes.

Impact:

- future agents cannot understand previous outcomes.

Recommendation:

- create compressed task history.

Priority: P2.

Auto-fix: safe.

### `continuity.decision-gap`

Signal:

- architecture or workflow changed but no decision entry exists.

Impact:

- agents may reopen settled tradeoffs.

Recommendation:

- add decision record.

Priority: P2.

Auto-fix: plan.

## Safety Rules

### `safety.mcp-broad-access`

Signal:

- MCP/tool config appears to allow broad filesystem or shell access.

Impact:

- agents can damage files outside intended scope.

Recommendation:

- restrict tool access to repo-scoped paths and explicit commands.

Priority: P0.

Auto-fix: manual.

### `safety.destructive-policy-missing`

Signal:

- no policy for destructive git or filesystem operations.

Impact:

- autonomous agents may remove or revert work unsafely.

Recommendation:

- add destructive action approval rule.

Priority: P1.

Auto-fix: safe.

## Rule Output Example

```text
P1 context.giant-file
  file: src/App.tsx
  signal: 1420 lines, likely common task path
  agent impact: small UI work loads routing, state, and presentation
  recommendation: split route shell, state hook, and UI panels
  auto-fix: manual
```

## Rule Philosophy

Doctor rules should be opinionated but not noisy.

A rule exists only when it explains how agents will struggle and what workflow improvement reduces that struggle.
