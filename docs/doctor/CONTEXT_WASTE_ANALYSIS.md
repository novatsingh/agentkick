# Context Waste Analysis

Context waste is the avoidable token load that makes coding agents slower, more expensive, and less reliable.

AgentKick Doctor analyzes context waste as a workflow architecture problem. It does not solve waste with embeddings, vector search, semantic retrieval, or graph infrastructure. It reduces waste through explicit memory, scoped tasks, clean boundaries, and compact files.

## Definition

Context waste exists when an agent must read information that is not needed for the task because the repository lacks structure, memory, or isolation.

Examples:

- a small button fix requires reading a 1,500-line component
- an API change requires scanning frontend code because contracts are undocumented
- a bug fix needs old chat history because task history was never written
- a new feature requires reading every route because feature summaries are missing
- generated files appear in agent-visible paths

## Waste Categories

### 1. Structural Waste

The repo shape forces agents to load unrelated code.

Signals:

- giant files
- oversized React components
- mixed routing, state, UI, and data access
- feature logic spread across unrelated folders
- global utility files containing business logic
- low-cohesion modules

Agent impact:

- agents patch around complexity
- task scope expands
- reviews get noisy

### 2. Memory Waste

Agents rediscover durable project knowledge.

Signals:

- missing `FEATURE_SUMMARIES.md`
- missing `API_CONTRACTS.md`
- missing `ARCHITECTURE.md`
- missing `DECISIONS.md`
- stale `CURRENT_TASK.md`
- no compressed `TASK_HISTORY.md`

Agent impact:

- user repeats explanations
- agents infer behavior from code
- thread resets lose project continuity

### 3. Instruction Waste

Agent instructions are too long, duplicated, or contradictory.

Signals:

- same rules repeated in many files
- no source-of-truth declaration
- `AGENTS.md` over budget
- agent-specific files drift from canonical memory
- instructions mix stable rules with task details

Agent impact:

- agents spend tokens on boilerplate
- conflicting instructions cause hesitation
- task-specific details become stale

### 4. Execution Waste

Agents run broad commands or inspect broad areas because execution scope is unclear.

Signals:

- no narrow test commands
- no task scope
- no workflow rules
- no package boundaries
- verification requires full system when small checks would work

Agent impact:

- slower loops
- more failures unrelated to the task
- skipped verification

### 5. History Waste

Historical noise remains in active context.

Signals:

- raw logs in memory
- long task history not compacted
- stale decisions auto-loaded
- archived task files in default context
- transcripts committed as docs

Agent impact:

- agents trust old information
- current truth gets buried
- token budget drains before code is loaded

## Waste Metrics

Doctor should emit practical metrics:

```text
Context Hot Files
Memory Gaps
Instruction Duplication
History Load
Generated Exposure
Task Scope Width
Verification Breadth
```

These are not generic code metrics. They estimate agent friction.

## Detection Rules

### Giant File

Signal:

- source file above configured line threshold
- file is not generated
- file likely participates in common task paths

Default thresholds:

```text
warning: 500 lines
high: 900 lines
critical: 1400 lines
```

Finding:

```text
P1 context waste: src/App.tsx is 1420 lines.
Agent impact: Small UI changes require loading routing, state, and presentation together.
```

### Oversized React Component

Signal:

- component file above threshold
- many hooks or state groups
- multiple UI regions
- mixed data access and presentation

Default thresholds:

```text
warning: 350 lines
high: 700 lines
critical: 1100 lines
```

Recommended split:

- route shell
- state hook
- feature panel
- presentational components
- API client or contract usage

### Missing Feature Summary

Signal:

- product repo with feature directories
- no `FEATURE_SUMMARIES.md`
- no `.agentkick/memory/features/*`

Agent impact:

- agents must discover feature behavior from code every time

### Missing API Contract

Signal:

- API routes, schemas, RPC handlers, or service clients exist
- no `API_CONTRACTS.md`

Agent impact:

- agents may change interfaces without seeing compatibility constraints

### Raw Log Memory

Signal:

- memory files contain long command output
- repeated stack traces
- transcript-style text
- large unstructured blocks

Agent impact:

- agents load noise instead of durable facts

### Generated Exposure

Signal:

- generated/vendor/build paths are referenced in context manifest
- agent rules tell tools to scan broad directories
- no avoid-load policy

Agent impact:

- agent wastes tokens on files it should never reason about

## Context Hot Zone Report

Example:

```text
Context Waste

Hot zones
  src/App.tsx                  1420 lines   critical
  src/lib/api.ts                840 lines   high
  TASK_HISTORY.md               510 lines   compact
  docs/debug-log.md             390 lines   raw log candidate

Missing summaries
  FEATURE_SUMMARIES.md
  API_CONTRACTS.md

Default context exposure
  dist/
  coverage/

Estimated agent impact
  Common feature work loads 3.4x more context than needed.
```

## Token Waste Risk Calculation

Token Waste Risk is a heuristic risk score.

Inputs:

- hot file count
- hot file severity
- required memory missing
- raw history size
- duplicate instruction count
- generated exposure
- task scope width
- stale memory count

Output:

```text
Token Waste Risk: 68/100 expensive
```

Risk levels:

```text
0-19    clean
20-39   watch
40-59   noisy
60-79   expensive
80-100  context fire
```

## Waste Reduction Playbook

### Reduce Structural Waste

- split giant files
- separate route shells from feature logic
- move data access behind contracts
- create feature folders
- document boundaries in `ARCHITECTURE.md`

### Reduce Memory Waste

- create feature summaries
- document API contracts
- add decisions
- compact task history
- update stale current task

### Reduce Instruction Waste

- make `AGENTS.md` the operating entry point
- move task details into `CURRENT_TASK.md`
- remove duplicated rules
- declare source of truth

### Reduce Execution Waste

- document narrow test commands
- add task scopes
- isolate package scripts
- define verification workflow

### Reduce History Waste

- archive old task files
- compact monthly history
- remove raw logs from active memory
- mark superseded decisions

## Anti-Pattern Labels

Doctor should use memorable labels:

- Context Furnace: one file burns the context budget.
- Memory Void: agents must rediscover durable truth.
- Workflow Fog: commands and execution path are unclear.
- Thread Anchor: progress depends on the current chat surviving.
- Feature Spill: one feature leaks across unrelated folders.
- Contract Shadow: API behavior exists only in code.
- History Sludge: old logs and stale notes bury current truth.

Labels should clarify, not insult.

## Context Waste Philosophy

Token optimization is not about being terse everywhere. It is about putting durable knowledge in the right place and keeping task context focused.

The best context is not bigger. It is cleaner.
