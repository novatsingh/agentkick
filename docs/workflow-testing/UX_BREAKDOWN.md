# UX Breakdown

This document reviews how AgentKick should feel in real terminal usage.

## UX Principle

AgentKick CLI output should answer four questions quickly:

1. What did you inspect?
2. What did you change?
3. Why does this matter for coding agents?
4. What should I run next?

If output does not answer those questions, it is probably noise.

## First Run

Command:

```bash
npx agentkick doctor
```

Expected behavior when repo is not initialized:

```text
AgentKick Doctor

AI readiness: 41/100 not ready

Inspected
  package.json
  128 source files
  0 AgentKick memory files

Top risks
  P1 memory gap       no AGENTS.md or repo memory for agents
  P1 context risk     dist/ and coverage/ are visible to agents
  P2 workflow gap     test command not documented for agents

Next
  npx agentkick init --minimal
```

Why this works:

- it gives value before setup
- it does not shame the developer
- it suggests one command

Bad behavior:

```text
AgentKick is not initialized. Run agentkick init.
```

This loses the chance to prove value.

## Init UX

Command:

```bash
npx agentkick init --minimal
```

Expected output:

```text
AgentKick Init

Created
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick/memory/project.md
  .agentkick/memory/decisions.md
  .agentkick/memory/tasks.md
  .agentkick/context/manifest.json

Source files changed
  none

Next
  git diff
  npx agentkick doctor
```

Important details:

- "Source files changed: none" builds trust.
- `git diff` is the right next step for cautious developers.
- Avoid a celebratory banner.

## Doctor UX

Doctor should be the daily habit.

Good shape:

```text
AgentKick Doctor

AI readiness: 82/100 usable

Fix now
  P1 context risk     src/App.tsx is 1,240 lines; small UI tasks require unrelated state.
  P1 memory gap       API behavior exists but no API contract memory is declared.

Fix next
  P2 workflow gap     build command is present but not documented for agents.

Strong
  AGENTS.md exists
  generated folders excluded
  test command detected

Next
  agentkick fix --plan
```

Rules:

- findings first
- one score only
- agent impact in plain language
- next command at bottom

Avoid:

- long tables by default
- too many category scores
- abstract "workflow intelligence" language
- generic maintainability warnings

## Fix Plan UX

Command:

```bash
agentkick fix --plan
```

Expected output:

```text
AgentKick Fix

Plan only. No files changed.

Will create
  .agentkick/memory/project.md
  .agentkick/context/manifest.json

Will update
  AGENTS.md                 add Memory Map
  WORKFLOW_RULES.md         add Verification section

Will not change
  application source files
  package scripts
  lockfiles

Manual follow-up
  src/App.tsx is oversized; split later when not shipping a hotfix.

Apply
  agentkick fix --safe
```

Why this works:

- it separates safe automation from manual refactor
- it reduces fear
- it teaches the safety boundary

## Focus UX

Command:

```bash
agentkick focus --files src/billing/checkout.ts src/billing/checkout.test.ts
```

Expected output:

```text
AgentKick Focus

Task scope
  explicit files

Read first
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick/memory/project.md

Task files
  src/billing/checkout.ts
  src/billing/checkout.test.ts

Avoid
  dist/
  coverage/
  node_modules/

Verification
  npm test -- checkout

Copy into agent prompt
  Work only inside the listed task files unless investigation proves another file is required.
```

Critical behavior:

- explicit scopes must work without task ids
- output should be short enough to paste into an AI tool
- uncertainty should be visible

Bad behavior:

```text
No task manifest found.
```

This punishes practical usage.

## Summarize UX

Command:

```bash
agentkick summarize --task "Fix checkout retry"
```

Expected prompt or output shape:

```text
AgentKick Summarize

Status
  complete | blocked | handed off

Required fields
  Result
  Files changed
  Verification
  Follow-up

Memory target
  .agentkick/memory/tasks.md
```

Generated entry should look like:

```markdown
## 2026-05-13 - Fix checkout retry

- Status: complete
- Result: Retry now preserves coupon state after payment failure.
- Files: `src/billing/checkout.ts`, `src/billing/checkout.test.ts`
- Verification: `npm test -- checkout`
- Follow-up: Add e2e coverage for annual plan coupon retry.
```

Rules:

- no raw logs
- no full chat transcript
- no unverified claims
- failure state must be explicit

## Strict Mode UX

Command:

```bash
agentkick doctor --strict
```

Strict output should be blunt but fair:

```text
AgentKick Doctor Strict

Gate: failed

Blocking
  P0 workflow gap     no verification command documented
  P1 context risk     generated build output is not excluded

Not blocking
  P2 maintainability  src/App.tsx is oversized

Next
  agentkick fix --plan
```

Strict mode should not block on every improvement opportunity.

## Error UX

Bad:

```text
Error: EACCES
```

Better:

```text
AgentKick could not write backup files.

Path
  .agentkick-backup/AGENTS.md

Likely cause
  synced folder or filesystem lock

No files were changed.

Try
  agentkick init --backup-dir C:\tmp\agentkick-backups
```

Errors must preserve trust by saying whether files changed.

## UX Copy Rules

Use:

- "No files changed."
- "Source files changed: none."
- "Manual follow-up."
- "Agents will waste context here."
- "Task cannot be resumed reliably."

Avoid:

- "AI brain"
- "autonomous runtime"
- "workflow intelligence layer"
- "semantic understanding"
- "magic context"

## UX Conclusion

The CLI should feel like a senior engineer leaving a clean handoff:

- short
- specific
- reversible
- honest about uncertainty
- clear about the next command
