# Context Engine

The AgentKick Context Engine is the core operating layer of the platform.

It manages what an AI coding agent should know, when it should know it, how long that context remains active, and what durable memory should survive after the task ends.

The Context Engine is not semantic retrieval, vector search, code indexing infrastructure, GraphRAG, or prompt decoration. It is an AI task operating system for execution continuity.

## Core Philosophy

```text
Chat memory is temporary.
Project memory should not be.
```

Coding agents degrade when long conversations become the only state store. The Context Engine moves project continuity into structured files, task manifests, feature memory, workflow state, and compressed execution history.

## Mission

Reduce AI context waste while improving:

- execution accuracy
- task isolation
- workflow continuity
- repository maintainability
- thread reset safety
- agent handoff quality
- persistent memory quality

## Engine Responsibilities

The Context Engine owns:

- task context preparation
- memory loading rules
- focused file selection
- context prioritization
- execution scoping
- context pruning
- stale-context detection
- thread reset recommendations
- workflow state persistence
- feature memory packaging
- execution handoff between agents
- workflow timeline tracking
- context compression

It does not own:

- semantic search
- vector indexes
- code intelligence graphs
- model prompting tricks as product architecture
- autonomous code changes without workflow state

## Architectural Model

```text
User task
  -> classify
  -> decompose
  -> scope
  -> package context
  -> execute
  -> verify
  -> compress
  -> persist memory
  -> handoff or close
```

The engine treats every task as a bounded process with explicit inputs and outputs.

## Context Classes

### Operating Context

Always-loaded rules.

Examples:

- `AGENTS.md`
- `WORKFLOW_RULES.md`
- agent-specific instructions

Purpose:

- define safety
- define workflow
- define memory map
- define verification expectations

### Task Context

Current execution state.

Examples:

- `CURRENT_TASK.md`
- `.agentkick/tasks/<task-id>/task.md`
- workflow state file

Purpose:

- preserve goal
- preserve scope
- preserve plan
- preserve blockers
- survive thread resets

### Feature Context

Feature-scoped memory package.

Examples:

- `FEATURE_SUMMARIES.md`
- `.agentkick/memory/features/billing.md`
- `.agentkick/memory/features/chrome-extension-popup.md`

Purpose:

- explain product behavior
- list primary files
- preserve edge cases
- connect contracts and tests

### Contract Context

Interface memory.

Examples:

- `API_CONTRACTS.md`
- schema docs
- event contract memory

Purpose:

- protect compatibility
- prevent accidental response or payload drift

### Code Context

Focused source files and tests.

Purpose:

- provide the exact implementation surface needed for the current task

### Execution Context

Temporary outputs produced during work.

Examples:

- command output summaries
- error excerpts
- review notes
- verification result

Purpose:

- support the current task only
- compress into durable memory when useful

## Context Priority

```text
P0 required to start
P1 required for this task class
P2 likely useful if scope touches it
P3 optional continuity support
P4 manual reference only
P5 excluded by default
```

Default policy:

```text
P0 AGENTS.md
P0 WORKFLOW_RULES.md
P0 CURRENT_TASK.md when present
P1 task manifest
P1 feature memory for scoped feature
P1 API contracts for interface work
P1 design system for UI work
P1 architecture for boundary work
P2 source files in execution scope
P2 tests in execution scope
P3 recent task history
P5 generated, vendor, build, coverage, raw transcripts
```

## Context Package

A context package is the prepared bundle for one agent run.

Fields:

```yaml
task_id:
task_type:
goal:
scope:
agent:
priority_files:
memory_files:
code_files:
excluded_paths:
verification:
constraints:
handoff_notes:
budget:
```

The package is not a copy of the world. It is the smallest useful operating set.

## CLI Concepts

### `agentkick focus`

Build a context package for the current task.

```bash
agentkick focus --task TASK-123
agentkick focus --feature billing
agentkick focus --files src/billing/checkout.ts
```

Output:

```text
AgentKick Focus

Loaded
  P0 AGENTS.md
  P0 WORKFLOW_RULES.md
  P1 .agentkick/tasks/TASK-123/task.md
  P1 .agentkick/memory/features/billing.md
  P1 API_CONTRACTS.md
  P2 src/billing/checkout.ts
  P2 src/billing/checkout.test.ts

Excluded
  dist/
  coverage/
  node_modules/

Context status: focused
```

### `agentkick prepare-task`

Create task state and context package before execution.

```bash
agentkick prepare-task "Fix checkout coupon validation"
```

### `agentkick split-task`

Decompose a broad task into child tasks.

```bash
agentkick split-task TASK-123
```

### `agentkick summarize`

Summarize active execution context.

```bash
agentkick summarize --task TASK-123
```

### `agentkick reset-context`

Prepare safe handoff for a new thread.

```bash
agentkick reset-context --task TASK-123
```

### `agentkick continue`

Resume from persisted state.

```bash
agentkick continue TASK-123
```

### `agentkick compact`

Compress old task and execution history.

```bash
agentkick compact --tasks --older-than 30d
```

### `agentkick workflow-state`

Inspect current workflow state.

```bash
agentkick workflow-state
agentkick workflow-state TASK-123 --json
```

## Context Lifecycle

```text
empty -> prepared -> focused -> executing -> dirty -> summarized -> compressed -> persisted -> closed
```

### Empty

No active task state.

### Prepared

Task exists with goal, scope, and expected verification.

### Focused

Context package exists and is ready for an agent.

### Executing

Agent is working against the scoped context.

### Dirty

Execution produced new facts, files, errors, or decisions that are not yet summarized.

### Summarized

Temporary execution context has been compressed into a handoff.

### Compressed

Durable facts have been extracted from execution notes.

### Persisted

Memory files and task history reflect verified outcomes.

### Closed

Task is complete, blocked, cancelled, or handed off.

## Stale Context Detection

The engine should flag:

- `CURRENT_TASK.md` older than threshold
- task references missing files
- feature memory references removed files
- API contracts not updated after interface changes
- workflow state says executing but no recent activity exists
- context package includes files now outside scope
- command output summaries older than code changes
- agent handoff missing verification status

Stale context should be marked, not silently deleted.

## Context Pruning

Pruning removes active context that no longer helps the task.

Prune:

- raw command output after root cause is summarized
- failed attempts after final fix is verified
- superseded subtask plans
- unrelated feature memory
- old task history after continuity summary
- generated files

Keep:

- current goal
- accepted constraints
- final decisions
- changed files
- verification results
- unresolved blockers
- next step

## Product Standard

The Context Engine succeeds when:

- new threads resume work without chat history
- broad tasks split into safe execution units
- agents load fewer files but act more accurately
- completed work strengthens durable memory
- Doctor scores improve through workflow design, not prompt tricks
