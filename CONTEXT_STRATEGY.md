# Context Strategy

AgentKick treats context as a scarce engineering resource.

The context strategy defines how agents decide what to read, what to ignore, what to summarize, and what to write back. It exists to prevent context overflow, repeated explanations, and degraded long-thread behavior.

AgentKick does not use vector retrieval or embeddings to solve context. It uses explicit memory files, task scopes, priorities, budgets, and workflow rules.

## Goals

- Keep agent context small and high-signal.
- Make thread resets safe.
- Load durable memory before task-local details.
- Avoid loading generated, vendor, build, and transcript noise.
- Give each task enough context to execute without reading the whole repo.
- Preserve continuity through structured files, not chat history.

## Context Sources

AgentKick context comes from five sources:

### 1. Operating Context

Stable rules that apply to every task.

Files:

- `AGENTS.md`
- `WORKFLOW_RULES.md`
- agent-specific rendered files such as `CLAUDE.md` or `.cursor/rules/*`

Default behavior: always load.

### 2. Active Task Context

The current unit of work.

Files:

- `CURRENT_TASK.md`
- task manifest under `.agentkick/tasks/*` when available

Default behavior: always load when present.

### 3. Project Memory Context

Durable project intelligence.

Files:

- `ARCHITECTURE.md`
- `FEATURE_SUMMARIES.md`
- `API_CONTRACTS.md`
- `DESIGN_SYSTEM.md`
- `DECISIONS.md`
- `TASK_HISTORY.md`

Default behavior: load based on task type and scope.

### 4. Code Context

Relevant source files, tests, config, and documentation.

Default behavior: load only files directly tied to the current task.

### 5. Execution Context

Command outputs, errors, screenshots, build reports, and review findings produced during the task.

Default behavior: keep only summarized results unless raw output is needed to debug a failure.

## Context Priority

```text
Priority 0: required operating and active task files
Priority 1: task-specific memory files
Priority 2: directly relevant code and tests
Priority 3: recent task history or decision context
Priority 4: optional reference material
Priority 5: excluded unless explicitly requested
```

Default load map:

```text
P0 AGENTS.md
P0 WORKFLOW_RULES.md
P0 CURRENT_TASK.md
P1 ARCHITECTURE.md
P1 FEATURE_SUMMARIES.md when touching product behavior
P1 API_CONTRACTS.md when touching interfaces
P1 DESIGN_SYSTEM.md when touching UI
P1 DECISIONS.md when changing architecture
P2 source files in scope
P2 tests in scope
P3 TASK_HISTORY.md for regression or continuity tasks
P5 node_modules, vendor, dist, build, coverage, lockfile internals, raw transcripts
```

## Context Budgets

Budgets should be explicit and configurable.

Recommended defaults:

```text
Operating context: 10 percent
Memory context: 20 percent
Task context: 20 percent
Code context: 35 percent
Execution output: 10 percent
Final response buffer: 5 percent
```

Budgets are not exact token counters at first. They are product constraints:

- keep `AGENTS.md` short
- avoid loading all history
- summarize command output
- load only relevant feature summaries
- prefer file references over copied code

## Task-Type Loading Rules

### Bug Fix

Load:

- `AGENTS.md`
- `WORKFLOW_RULES.md`
- `CURRENT_TASK.md`
- relevant feature summary
- relevant API contract if interface behavior is involved
- recent `TASK_HISTORY.md` entries only if regression context matters
- failing file and nearest tests

Avoid:

- broad architecture docs unless the bug crosses boundaries
- unrelated feature summaries

### Feature Implementation

Load:

- operating context
- `FEATURE_SUMMARIES.md`
- `ARCHITECTURE.md`
- `API_CONTRACTS.md` if data/interface changes
- `DESIGN_SYSTEM.md` if UI changes
- relevant code and tests

Write back:

- feature summary update
- API contract update
- task history entry
- decision entry if tradeoff is durable

### Refactor

Load:

- operating context
- `ARCHITECTURE.md`
- relevant decisions
- API contracts affected by boundaries
- tests covering behavior

Write back:

- architecture update if boundaries changed
- decision entry if approach matters
- task history entry

### UI Work

Load:

- operating context
- `DESIGN_SYSTEM.md`
- related feature summaries
- frontend code and styles
- accessibility rules from packs when installed

Avoid:

- backend contracts unless UI talks to API behavior.

### API Work

Load:

- operating context
- `API_CONTRACTS.md`
- `ARCHITECTURE.md`
- related feature summaries
- endpoint code and tests

Write back:

- API contract updates before finalizing
- migration notes for breaking changes

### Security Review

Load:

- operating context
- `WORKFLOW_RULES.md`
- security pack rules
- `ARCHITECTURE.md`
- `API_CONTRACTS.md`
- relevant source files

Avoid:

- unrelated design history
- large task history unless investigating a known vulnerability

## Context Inheritance

Context inheritance lets child tasks receive the right subset of parent task knowledge.

Rules:

- Parent task constraints are inherited by default.
- Child tasks inherit only relevant memory files.
- Child tasks must not inherit raw command output unless failure analysis needs it.
- Child task completion should update the parent task summary.
- When a parent task closes, child outcomes are compressed into one durable memory update.

Example:

```text
Parent task: build trial system
Child task A: backend OTP endpoint
Child task B: popup verification UI
Child task C: email template
```

Each child receives shared constraints and its own file scope. The parent receives completion summaries.

## Context Summarization Rules

Summaries should be short, factual, and tied to verified behavior.

Summarize:

- task outcome
- files changed
- commands run
- failed verification with exact blocker
- decisions made
- follow-up risks

Do not summarize:

- every command line
- every failed attempt
- raw stack traces after root cause is known
- speculative ideas that were not adopted
- copied source code unless the exact snippet is the contract

Recommended summary fields:

```markdown
## Summary

- Goal:
- Result:
- Files:
- Verification:
- Decisions:
- Follow-up:
```

## Token Optimization Rules

- Prefer bullets over paragraphs for memory.
- Prefer stable headings over prose introductions.
- Keep each memory file scoped to one purpose.
- Keep repeated boilerplate out of feature entries.
- Link to files instead of copying code.
- Summarize long command output.
- Load only relevant sections when possible.
- Archive old task history after compaction.
- Avoid duplicate facts across files.
- Mark source of truth when facts appear in more than one place.

## Feature-Scoped Context

Large products should support feature-scoped memory.

Recommended layout:

```text
.agentkick/
  memory/
    features/
      billing.md
      onboarding.md
      chrome-extension-popup.md
      admin-dashboard.md
```

Feature memory should contain:

- user-facing behavior
- primary files
- internal boundaries
- API contracts used
- state model
- known edge cases
- test commands
- recent important changes

Top-level `FEATURE_SUMMARIES.md` should act as an index. Large details move to feature files.

## Thread Reset Strategy

Thread reset should be a normal workflow:

1. Write current progress to `CURRENT_TASK.md`.
2. Compress raw execution context into a short handoff.
3. Update durable memory only for verified facts.
4. Start the new thread with P0 files and task-specific P1 files.
5. Continue from the task plan, not from the old conversation.

Thread reset prompt should be generated from memory, not hand-written by the user.

## Context Preview

AgentKick should provide:

```bash
agentkick context preview --task bugfix
agentkick context preview --task feature --scope billing
```

Preview output should show:

- files included
- priority
- reason
- estimated size class
- excluded files
- missing memory warnings

This makes context decisions inspectable before an agent spends tokens.

## Failure Modes

### Context Overload

Symptoms:

- agent reads too much
- output becomes generic
- task loses focus

Fix:

- reduce loaded history
- scope feature memory
- summarize command output
- split task

### Stale Context

Symptoms:

- agent follows outdated commands
- feature summary disagrees with code
- old decision conflicts with current architecture

Fix:

- run memory validation
- mark stale entries
- update source of truth
- add review date to temporary decisions

### Missing Context

Symptoms:

- user repeats project basics
- agent asks avoidable questions
- task cannot resume after reset

Fix:

- update `AGENTS.md`
- create feature summary
- add workflow rule
- update current task handoff

## Product Standard

Context strategy succeeds when agents read less, ask fewer repeated questions, and produce more focused work.

AgentKick should make context explicit, reviewable, and cheap.
