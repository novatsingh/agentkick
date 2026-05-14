# CLI Execution Plan

This document defines the implemented v1 launch command surface.

## Shared CLI Rules

Every command must output:

- command name
- files inspected or changed
- source file change status
- top result or finding
- next command

Every write command must support:

- dry-run plan
- exact file list
- backup behavior
- managed-section ownership
- clear failure message

## `agentkick init`

Purpose:

- prepare the repo for AI-assisted development

Inputs:

```bash
agentkick init
agentkick init --dry-run
```

Behavior:

- detect stack and package manager
- create minimal AgentKick files
- create or update `AGENTS.md`
- create or update `WORKFLOW_RULES.md`
- write `.agentkick.json`
- write root-level workflow memory
- write `.agentkick/workflow-state.json`
- avoid app source changes

Output:

```text
AgentKick Init

Created
  AGENTS.md
  CLAUDE.md
  CURRENT_TASK.md
  ARCHITECTURE.md
  FEATURE_SUMMARIES.md
  WORKFLOW_RULES.md
  DECISIONS.md
  TASK_HISTORY.md
  .agentkick.json
  .agentkick/workflow-state.json

Source files changed
  none

Next
  git diff
  agentkick doctor
```

Exit codes:

- `0` success
- `2` invalid config
- `5` filesystem write failed

## `agentkick doctor`

Purpose:

- inspect AI workflow readiness

Inputs:

```bash
agentkick doctor
agentkick doctor --strict
agentkick doctor --json
agentkick doctor --debug
```

Behavior:

- scan cheap repo structure
- detect memory presence
- detect agent operating files
- detect test/build commands
- detect generated/vendor/build folders exposed to agent context
- detect oversized memory files
- detect stale current task state when timestamps are available
- detect package script mismatches
- detect giant files
- produce one readiness score
- produce top findings with agent impact

Output:

```text
AgentKick Doctor

AI readiness: 82/100 usable

Top 3 risks
  P1 context-waste  src/App.tsx has 1,240 lines; agents must load unrelated UI state.
  P1 memory         WORKFLOW_RULES.md is missing; execution rules live only in chat.

Strong
  AGENTS.md exists
  generated folders excluded
  test command detected

Next
  agentkick init --dry-run
```

Strict mode:

- fails on P0 findings
- fails when required memory is missing
- fails when generated output is exposed
- fails when no verification command is known

JSON mode:

- stable shape for CI and future integrations
- includes score, findings, detected stack, verification command, next command, and generated/vendor paths
- no dashboard dependency

## `agentkick focus`

Purpose:

- build a compact agent context brief for one task

Inputs:

```bash
agentkick focus popup
agentkick focus checkout
agentkick focus "Fix popup CTA"
agentkick focus --feature billing
agentkick focus --task "Improve README positioning"
agentkick focus --files README.md package.json
```

Behavior:

- read `AGENTS.md`
- read `WORKFLOW_RULES.md`
- load current root-level workflow memory
- apply avoid paths
- infer likely scoped files from the provided scope text
- prefer explicit `--files` scope as the source of truth
- print a paste-ready task brief for Codex and other coding agents
- show uncertainty when scope is incomplete
- warn when scope is too broad
- never copy full source file contents

Output:

```text
AgentKick Focus

Task
  Improve README positioning

Read first
  AGENTS.md
  WORKFLOW_RULES.md
  CURRENT_TASK.md

Task files
  src/popup/index.html
  src/popup/index.js

Avoid
  dist/
  release/
  node_modules/

Verification
  npm test

Uncertainty
  Explicit --files scope is being used as the source of truth.

Agent prompt
  Work only in the task files unless investigation proves another file is required.
  Verify with npm test and manual popup check.
```

Token optimization:

- excludes generated and vendor paths
- keeps output paste-ready
- never copies full source files
- never performs semantic retrieval
- updates `CURRENT_TASK.md`
- updates `.agentkick/workflow-state.json`

## `agentkick summarize`

Purpose:

- compress task work into durable memory

Inputs:

```bash
agentkick summarize
agentkick summarize popup
agentkick summarize --task "Improve README positioning"
agentkick summarize --task "Improve README positioning" --handoff
```

Behavior:

- read current workflow state
- read active scope from `.agentkick/workflow-state.json` or `CURRENT_TASK.md`
- detect likely scoped files from the selected scope
- print a compact fresh-chat summary
- append a compact entry to `TASK_HISTORY.md`
- include status, result, changed files, verification state, blocker, and next step
- avoid raw logs

Output:

```text
AgentKick Summary

Entry
  Project: browser-helper
  Task: Fix popup CTA
  Status: handoff
  Scope: popup
  Files: src/popup/index.html, src/popup/index.js
  Verification: npm test

Fresh-chat handoff
  Task: Fix popup CTA
  Status: handoff
  Changed files: src/popup/index.html, src/popup/index.js
  Next: continue from the compact handoff

Next
  paste summary into the next agent session
```

Fresh-chat handoff:

- includes project, stack, scope, files, commands, and compressed memory
- does not mutate source files
- does not store raw logs

## `agentkick split-task`

Purpose:

- turn a broad AI request into scoped execution chunks

Inputs:

```bash
agentkick split-task "Add paid plan checkout"
agentkick split-task "Improve extension popup" --files popup.html popup.js background.js
```

Behavior:

- keep decomposition rule-based and explicit
- use task text and file hints
- use repo profile and known commands
- output 2-5 subtasks
- include scope, non-goals, dependencies, verification
- include suggested files when hints are available
- include one agent-ready prompt per chunk
- print stable JSON with `--json`
- no file writes by default

Output:

```text
AgentKick Split Task

Task
  Improve extension popup

Suggested execution
  1. Fix popup layout
     Scope: popup.html, popup.js
     Non-goal: background messaging
     Verify: manual popup check

  2. Fix CTA state handling
     Scope: popup.js
     Depends on: layout verified
     Verify: npm test

Next
  agentkick focus popup
```

Boundaries:

- no autonomous scheduling
- no agent assignment
- no semantic code ownership claims
- no background jobs
- no file edits by default

## Command Naming Lock

Implemented v1 launch commands:

- `init`
- `doctor`
- `focus`
- `split-task`
- `summarize`

Secondary implemented commands:

- `new`
- `add`

Do not rename them before v1 unless real users fail to understand them.
