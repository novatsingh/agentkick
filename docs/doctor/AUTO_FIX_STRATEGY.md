# Auto-Fix Strategy

AgentKick Doctor can fix workflow structure. It should not blindly rewrite application architecture.

Auto-fix exists to make safe AI-readiness improvements fast while preserving user control. Every fix should be plan-first, reviewable, reversible, and scoped.

## Fix Philosophy

AgentKick fixes memory and workflow scaffolding automatically. It recommends code architecture changes unless the user explicitly asks for implementation.

Safe auto-fix:

- create missing memory files
- add missing required sections
- add context exclusions
- add source-of-truth markers
- scaffold task files
- create workflow rule templates
- compact obvious raw memory only with preview

Manual fix:

- split giant React components
- refactor duplicated business logic
- reorganize folders
- change API boundaries
- modify global state architecture
- alter package boundaries

## Fix Modes

### Plan Mode

Default for `agentkick fix`.

```bash
agentkick fix
agentkick fix --plan
```

Behavior:

- analyze findings
- show proposed file operations
- classify safe/manual fixes
- do not write files

### Safe Mode

```bash
agentkick fix --safe
```

Behavior:

- apply only low-risk scaffolding and metadata updates
- preserve backups
- never modify application source
- never delete memory
- print verification command

### Interactive Mode

```bash
agentkick fix --interactive
```

Behavior:

- ask before each fix group
- allow user to skip, apply, or open details
- useful for existing repos with hand-written docs

### Strict Mode

```bash
agentkick fix --strict
```

Behavior:

- only fixes required to pass configured readiness gate
- fails if manual fixes remain
- suitable for CI recommendations, not automatic CI writes

## Fix Categories

### Memory Scaffolds

Findings:

- missing `FEATURE_SUMMARIES.md`
- missing `API_CONTRACTS.md`
- missing `TASK_HISTORY.md`
- missing `DECISIONS.md`
- missing `WORKFLOW_RULES.md`

Fix:

- create file with required structure
- add short purpose
- add placeholders that ask for durable facts
- avoid inventing behavior

Risk: low.

Auto-fix: safe.

### Memory Section Repair

Findings:

- memory file exists but lacks required sections
- no priority metadata
- no source-of-truth marker

Fix:

- add missing sections
- preserve existing content
- do not reorder heavily by default

Risk: low to medium.

Auto-fix: safe or interactive.

### Context Exclusions

Findings:

- generated/vendor/build files included in default context
- no avoid-load policy

Fix:

- create or update `.agentkick/context/manifest.json`
- add avoid-load entries:
  - `node_modules/`
  - `dist/`
  - `build/`
  - `coverage/`
  - generated asset directories

Risk: low.

Auto-fix: safe.

### Workflow Rules

Findings:

- missing verification workflow
- missing memory update workflow
- missing destructive action policy

Fix:

- add sections to `WORKFLOW_RULES.md`
- populate from detected package scripts when available
- use placeholders when commands are unknown

Risk: low.

Auto-fix: safe.

### Task Scope

Findings:

- active work with no `CURRENT_TASK.md`
- stale current task

Fix:

- create task template
- mark stale tasks with status and cleanup prompt
- never assume completion

Risk: medium.

Auto-fix: plan or interactive.

### Memory Compaction

Findings:

- task history over budget
- raw logs in memory

Fix:

- propose compacted summary
- preserve original until accepted
- never delete raw memory without explicit approval

Risk: medium.

Auto-fix: interactive.

### Architecture Refactor Suggestions

Findings:

- giant files
- oversized components
- duplicated logic
- massive dependency chains
- feature spill

Fix:

- generate refactor plan
- identify split boundaries
- suggest order
- do not edit source automatically in Doctor mode

Risk: high.

Auto-fix: manual.

## Fix Plan Output

```text
AgentKick Fix

Plan only. No files changed.

Safe fixes
  create FEATURE_SUMMARIES.md
  create API_CONTRACTS.md
  create TASK_HISTORY.md
  update AGENTS.md with Memory Map
  create .agentkick/context/manifest.json

Interactive fixes
  compact TASK_HISTORY.md from 612 lines to 140 lines
  mark CURRENT_TASK.md stale

Manual fixes
  split src/App.tsx
  isolate billing validation logic

Apply safe fixes
  agentkick fix --safe
```

## Fix Patch Rules

Every applied fix should:

- preserve user edits
- create backups when overwriting
- be dry-runnable
- be deterministic
- include generated markers when appropriate
- avoid changing unrelated files
- explain what changed

Generated marker:

```markdown
<!-- agentkick:managed-section memory-map/v1 -->
...
<!-- /agentkick:managed-section -->
```

AgentKick may update managed sections automatically. It must not treat the rest of a human-edited file as owned.

## Source Safety

Doctor must not auto-refactor source code from health findings.

Reason:

- workflow health findings are structural signals
- splitting application code requires product understanding
- code changes need tests and behavior verification

Doctor can generate a refactor brief:

```markdown
# Refactor Brief: src/App.tsx

## Problem

- 1420 lines
- mixed routing, API calls, state, and presentation

## Proposed Boundaries

- `src/app/AppShell.tsx`
- `src/features/billing/useBillingState.ts`
- `src/features/billing/BillingPanel.tsx`
- `src/api/billingClient.ts`

## Verification

- `npm test`
- `npm run build`
```

The user or coding agent can then execute the refactor as a separate task.

## Memory Fix Templates

### `FEATURE_SUMMARIES.md`

```markdown
# Feature Summaries

## Feature Index

- Add active features here.

## Active Features

## Deprecated Features

## Feature File Map
```

### `API_CONTRACTS.md`

```markdown
# API Contracts

## Contract Index

## HTTP APIs

## Events

## Data Schemas

## External Integrations

## Deprecated Contracts
```

### `TASK_HISTORY.md`

```markdown
# Task History

## Recent Tasks

## Compacted History

## Archived Task Files
```

## Fix Verification

After fixes, Doctor should rerun relevant checks:

```text
created memory file -> validate required sections
updated workflow rules -> validate sections
created context manifest -> validate JSON
updated AGENTS.md -> validate Memory Map exists
```

Then print:

```text
Safe fixes applied.

AI Readiness:       78 -> 86
Context Complexity: 61 -> 72
Token Waste Risk:   68 -> 49

Manual work remains:
  src/App.tsx oversized component
```

## Fix Boundaries

Auto-fix must not:

- invent feature behavior
- invent API contracts
- delete memory without approval
- change app source automatically
- change CI secrets or deployment config automatically
- overwrite human sections without backup
- hide unresolved manual findings

Auto-fix may:

- create empty structured files
- add required sections
- copy known commands from package scripts
- add context exclusions
- mark stale memory
- produce refactor briefs

## Fix Philosophy

AgentKick fix should feel like infrastructure-grade cleanup:

```text
show the plan
apply only safe structure
leave hard product decisions to humans and agents
rerun Doctor
show the score delta
```

The best auto-fix does not pretend to understand the whole app. It clears the workflow path so the next coding agent can work with less confusion.
