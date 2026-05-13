# CLI Execution Plan

This document defines exactly how each v1 command works.

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
agentkick init --minimal
```

Behavior:

- detect stack and package manager
- create minimal AgentKick files
- create or update `AGENTS.md`
- create or update `WORKFLOW_RULES.md`
- write `.agentkick.json`
- write memory scaffold
- write context manifest
- avoid app source changes

Output:

```text
AgentKick Init

Created
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick.json
  .agentkick/memory/project.md
  .agentkick/memory/decisions.md
  .agentkick/memory/tasks.md
  .agentkick/context/manifest.json

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
```

Behavior:

- scan cheap repo structure
- detect memory presence
- detect agent operating files
- detect test/build commands
- detect context exclusions
- detect giant files
- detect raw logs in memory
- detect stale task state
- produce one readiness score
- produce top findings with agent impact

Output:

```text
AgentKick Doctor

AI readiness: 82/100 usable

Fix now
  P1 context risk  src/App.tsx is 1,240 lines; agents must load unrelated UI state.
  P1 memory gap    API behavior exists but no API memory is declared.

Strong
  AGENTS.md exists
  generated folders excluded
  test command detected

Next
  agentkick focus --files <paths>
```

Strict mode:

- fails on P0 findings
- fails when required memory is missing
- fails when generated output is exposed
- fails when no verification command is known

JSON mode:

- stable shape for CI and future integrations
- no dashboard dependency

## `agentkick focus`

Purpose:

- build a compact agent context brief for one task

Inputs:

```bash
agentkick focus --files src/popup.js popup.html
agentkick focus --feature popup
agentkick focus --task "Fix popup CTA"
```

Behavior:

- read `AGENTS.md`
- read `WORKFLOW_RULES.md`
- read `.agentkick/context/manifest.json`
- load minimal memory
- apply avoid paths
- accept explicit files as source of truth
- show uncertainty when scope is incomplete

Output:

```text
AgentKick Focus

Read first
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick/memory/project.md

Task files
  popup.html
  popup.js

Avoid
  dist/
  release/
  node_modules/

Agent prompt
  Work only in the task files unless investigation proves another file is required.
  Verify with npm test and manual popup check.
```

Token optimization:

- excludes generated and vendor paths
- keeps output paste-ready
- never copies full source files
- never performs semantic retrieval

## `agentkick summarize`

Purpose:

- compress task work into durable memory

Inputs:

```bash
agentkick summarize --task "Fix popup CTA"
agentkick summarize --task "Fix checkout retry" --handoff
```

Behavior:

- collect task title
- require status
- require result or blocker
- require verification state
- require changed files when available
- append compact entry to `.agentkick/memory/tasks.md`
- avoid raw logs

Output:

```text
AgentKick Summarize

Will append
  .agentkick/memory/tasks.md

Entry
  Status: complete
  Result: Popup CTA now opens trial flow.
  Files: popup.html, popup.js
  Verification: npm test; manual popup check

Next
  git diff
```

Handoff mode:

- marks task as blocked or handoff-ready
- includes next command
- includes known failure state

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
- optionally write `.agentkick/tasks/<task-id>.md` in a later flag

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
  agentkick focus --files popup.html popup.js
```

Boundaries:

- no autonomous scheduling
- no agent assignment
- no semantic code ownership claims
- no file edits by default

## Command Naming Lock

Use these names:

- `init`
- `doctor`
- `focus`
- `summarize`
- `split-task`

Do not rename them before v1 unless real users fail to understand them.
