# Workflow State Machine

The Workflow State Machine defines the durable state model for AgentKick execution.

It lets tasks survive thread resets, agent handoffs, workflow pauses, and multi-step execution.

## State Philosophy

Agent work needs observable state.

Without state, every chat becomes a fragile runtime. With state, agents can resume from project memory.

## Workflow States

```text
created
classified
decomposed
scoped
prepared
focused
executing
verifying
reviewing
compressing
persisting
completed
blocked
cancelled
handoff
stale
```

## State Transitions

```text
created -> classified
classified -> decomposed
classified -> scoped
decomposed -> scoped
scoped -> prepared
prepared -> focused
focused -> executing
executing -> verifying
executing -> blocked
executing -> handoff
verifying -> reviewing
verifying -> executing
reviewing -> compressing
reviewing -> executing
compressing -> persisting
persisting -> completed
blocked -> executing
handoff -> focused
handoff -> executing
stale -> focused
stale -> cancelled
```

## State Definitions

### Created

Task exists but has not been classified.

Required:

- title
- raw request
- created time

### Classified

Task type and risk class are known.

Required:

- task type
- likely memory
- likely verification

### Decomposed

Parent task has child tasks.

Required:

- child tasks
- dependencies
- inherited constraints

### Scoped

Execution boundary is known.

Required:

- include paths
- exclude paths
- memory files
- verification
- non-goals

### Prepared

Task files and workflow state exist.

Required:

- task manifest
- `CURRENT_TASK.md` update
- initial timeline event

### Focused

Context package is ready.

Required:

- context package
- priority files
- excluded paths
- budget status

### Executing

Agent is actively working.

Required:

- owner
- started time
- current step

### Verifying

Verification is running or required.

Required:

- command
- expected result
- status

### Reviewing

Work is being assessed.

Required:

- changed files
- verification summary
- risk notes

### Compressing

Execution context is being summarized.

Required:

- handoff or completion summary
- dropped noise list when useful

### Persisting

Durable memory is being updated.

Required:

- target memory files
- update summary
- verification status

### Completed

Task is done.

Required:

- result
- verification
- memory updates
- closed time

### Blocked

Task cannot proceed.

Required:

- blocker
- owner needed
- next possible action

### Cancelled

Task intentionally stopped.

Required:

- reason
- cleanup status

### Handoff

Task is transferred to another agent or thread.

Required:

- handoff summary
- context package
- next owner or role

### Stale

State appears outdated.

Required:

- stale reason
- refresh action

## Workflow State File

```yaml
id: TASK-123
title: Fix checkout coupon validation
status: focused
type: bugfix
created: 2026-05-13T10:00:00+05:30
updated: 2026-05-13T10:15:00+05:30
owner: codex
parent: null
children: []
zone: frontend.checkout
scope:
  include:
    - src/features/checkout/**
  exclude:
    - dist/**
memory:
  load:
    - AGENTS.md
    - WORKFLOW_RULES.md
    - .agentkick/memory/features/checkout.md
  update:
    - TASK_HISTORY.md
verification:
  commands:
    - npm.cmd test -- checkout
timeline:
  - at: 2026-05-13T10:00:00+05:30
    event: created
  - at: 2026-05-13T10:15:00+05:30
    event: focused
```

## State Persistence

Recommended layout:

```text
.agentkick/
  workflows/
    active/
      TASK-123/
        state.yaml
        task.md
        context.json
        handoff.md
        timeline.md
    archive/
```

Root compatibility:

- `CURRENT_TASK.md` mirrors the active task summary.

## Timeline Tracking

Timeline events should be compact:

```markdown
## Timeline

- 10:00 created from user request
- 10:05 classified as bugfix
- 10:10 scoped to checkout feature
- 10:15 context focused
- 10:40 verification failed: coupon expiry test
- 10:55 fix verified
```

Timeline should not store chat transcript.

## CLI: `agentkick workflow-state`

```bash
agentkick workflow-state
agentkick workflow-state TASK-123
agentkick workflow-state TASK-123 --json
agentkick workflow-state --active
agentkick workflow-state --stale
```

Output:

```text
AgentKick Workflow State

Active
  TASK-123  focused    Fix checkout coupon validation
  TASK-124  blocked    Update billing API contract

Stale
  TASK-118  executing  no activity for 4 days

Next
  agentkick continue TASK-123
```

## Stale State Rules

Mark stale when:

- active task exceeds age threshold
- state references missing files
- verification is older than changed files
- current owner no longer applies
- parent and child statuses conflict
- handoff is missing required fields

Stale state should not be auto-closed.

## State Machine Safety

The engine should reject transitions that skip required state.

Examples:

- cannot move from created to executing without scope
- cannot complete without verification status
- cannot persist memory without compression summary
- cannot handoff without next step
- cannot close parent while required children are active

## Product Standard

The state machine should make AI workflow visible.

If a task cannot be resumed from state files, the state machine failed.
