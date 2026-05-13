# Execution Orchestration

Execution Orchestration is the system that turns a user request into a scoped, verifiable, resumable AI workflow.

It coordinates task decomposition, context packaging, agent handoff, execution state, verification, compression, and memory write-back.

## Mission

Make AI work behave like a disciplined operating system process:

- explicit input
- isolated scope
- known permissions
- controlled execution
- observable state
- clean termination
- durable output

## Execution Lifecycle

```text
intake
  -> classify
  -> decompose
  -> scope
  -> prepare
  -> execute
  -> verify
  -> review
  -> compress
  -> persist
  -> close
```

### Intake

Capture:

- user request
- project
- active branch
- urgency
- constraints
- success condition

Output:

- raw task candidate

### Classify

Classify task type:

- bug fix
- feature
- refactor
- UI work
- API work
- security review
- release
- deployment debugging
- documentation
- architecture planning

Output:

- task class
- required memory types
- likely verification
- risk class

### Decompose

Split broad work into execution units.

Output:

- parent task
- child tasks
- dependency order
- shared constraints

### Scope

Define execution boundary.

Output:

- included files
- excluded files
- memory files
- feature package
- contracts
- tests
- allowed commands

### Prepare

Create durable task state.

Output:

- `CURRENT_TASK.md`
- task manifest
- context package
- workflow state

### Execute

Agent performs work inside scope.

Rules:

- inspect before editing
- preserve user changes
- avoid broad rewrites
- record scope changes
- update workflow state at checkpoints

### Verify

Run documented checks.

Output:

- verification status
- command summaries
- blocker notes

### Review

Evaluate:

- behavior
- scope adherence
- memory updates
- risk notes
- manual follow-up

### Compress

Turn execution noise into durable signal.

Output:

- handoff summary
- task history entry
- memory update proposal

### Persist

Write durable memory.

Output:

- updated feature memory
- updated contracts
- decision entries
- task history
- workflow timeline

### Close

Mark final state:

- completed
- blocked
- cancelled
- handed off

## Execution Object Model

### Workflow

A collection of related tasks.

Fields:

- id
- title
- status
- goal
- tasks
- timeline
- memory updates
- final outcome

### Task

Smallest meaningful unit of execution.

Fields:

- id
- type
- status
- owner
- scope
- constraints
- context package
- dependencies
- verification
- result

### Execution Zone

A bounded repo area where a task operates.

Fields:

- name
- files
- tests
- memory
- contracts
- owner
- risk level

### Handoff

A transfer object between agents or threads.

Fields:

- current state
- completed work
- changed files
- open blockers
- next step
- verification status
- context package reference

## Modular Execution Zones

Execution zones isolate work.

Examples:

```text
frontend.checkout
backend.billing-api
extension.popup
extension.background
monorepo.packages.cli
monorepo.apps.web
```

Zone definition:

```yaml
name: extension.popup
files:
  - popup/**
  - src/popup/**
tests:
  - tests/popup/**
memory:
  - .agentkick/memory/features/chrome-extension-popup.md
contracts:
  - API_CONTRACTS.md#trial-api
commands:
  - npm.cmd test -- popup
```

Zones are structural, not semantic. They are explicit workflow boundaries.

## Dependency-Aware Scoping

The orchestrator should understand task dependencies at workflow level.

Dependency types:

- code dependency
- contract dependency
- verification dependency
- memory dependency
- release dependency

Example:

```text
Task A: update API contract
Task B: update backend endpoint
Task C: update frontend client
Task D: update feature summary

B and C depend on A.
D depends on B and C verification.
```

The engine should not require graph infrastructure. It can model declared dependencies in task manifests.

## Execution Inheritance

Child tasks inherit:

- parent goal
- non-goals
- safety constraints
- relevant decisions
- shared verification requirements

Child tasks do not inherit:

- unrelated file scope
- raw command output
- sibling execution notes
- stale intermediate plans

Inheritance should reduce repeated context, not spread noise.

## Workflow Timeline

Every workflow should maintain a compact timeline:

```markdown
## Timeline

- 2026-05-13 10:20 prepared task scope
- 2026-05-13 10:35 split backend and frontend child tasks
- 2026-05-13 11:10 backend verified with `npm.cmd test -- api`
- 2026-05-13 11:45 frontend blocked by missing design rule
```

Timeline is not a transcript. It is observable state history.

## Agent Handoff

Handoffs allow work to move between:

- Codex
- Claude Code
- Cursor
- Copilot
- future agents
- new chat threads

Handoff package:

```markdown
# Handoff: TASK-123

## State

- Status:
- Owner:
- Last updated:

## Completed

## Changed Files

## Open Blockers

## Next Step

## Verification

## Context Package
```

## CLI Examples

```bash
agentkick prepare-task "Add team invite billing guard"
agentkick focus --task TASK-123
agentkick split-task TASK-123 --by zone
agentkick workflow-state TASK-123
agentkick summarize --task TASK-123
agentkick reset-context --task TASK-123
agentkick continue TASK-123
```

## Example: Chrome Extension Workflow

```text
Request: Fix trial popup verification.

Classify: bug fix, extension UI, API contract.
Scope: popup files, trial API contract, popup feature memory.
Execute: patch popup UI and error handling.
Verify: syntax check and constrained popup viewport check.
Persist: update chrome-extension-popup feature memory and task history.
```

## Example: SaaS Repo Workflow

```text
Request: Add seat limit enforcement.

Classify: feature, billing, API, UI.
Decompose:
  1. contract update
  2. backend enforcement
  3. frontend settings UI
  4. tests and memory update
Scope by billing execution zone.
Persist feature memory and API contract changes.
```

## Product Standard

Execution orchestration succeeds when agents stop operating from vague prompts and start operating from explicit workflow state.
