# Developer Experience Rules

This document defines the v1 product feel.

## Core Rule

AgentKick should feel like a sharp local tool that respects the repo.

It should never feel like it is taking over the project.

## Terminal Output Rules

Always show:

- what was inspected
- what changed
- why it matters for agents
- what to run next

Never show:

- noisy banners
- long philosophy
- vague success messages
- multiple next commands unless required
- generic AI buzzwords

## Write Safety Rules

Write commands must:

- support dry-run
- list every file they will create or update
- create backups before overwrites
- preserve user content
- use managed sections for generated blocks
- say whether source files changed

Write commands must not:

- edit app source files
- delete user files
- rewrite full files unnecessarily
- hide partial failures

## Doctor Rules

Doctor findings must:

- explain agent impact
- include concrete evidence
- recommend a safe next step
- avoid generic lint advice
- avoid fake semantic claims

Doctor output should prioritize:

1. P0/P1 workflow blockers.
2. Context waste.
3. Missing memory.
4. Verification gaps.
5. Lower-priority maintainability notes.

## Focus Rules

Focus must:

- prefer explicit files
- show read-first files
- show avoid paths
- show verification command
- produce paste-ready output
- state uncertainty when scope may be incomplete

Focus must not:

- claim semantic relevance
- copy full source into output
- require task manifests
- block on missing AgentKick files

## Summarize Rules

Summaries must include:

- status
- result or blocker
- files changed
- verification
- follow-up

Summaries must not include:

- raw terminal logs
- full chat transcripts
- speculative root causes
- large copied stack traces

## Split-Task Rules

Split-task must:

- create 2-5 subtasks
- define scope and non-goals
- identify obvious dependencies
- include verification per subtask
- produce agent-ready text

Split-task must not:

- schedule agents
- assign agents
- create hidden state
- infer code ownership beyond explicit files and folders

## Language Rules

Use:

- repo memory
- context manifest
- task scope
- safe fix
- handoff
- verification

Avoid:

- intelligence layer
- AI brain
- autonomous runtime
- semantic understanding
- workflow studio
- orchestration platform

## Error Rules

Every error must say:

- what failed
- which path or command failed
- whether files changed
- likely cause when known
- next safe action

Example:

```text
AgentKick could not write backup files.

Path
  .agentkick-backup/AGENTS.md

No files were changed.

Try
  agentkick init --backup-dir C:\tmp\agentkick-backups
```

## Trust Rules

Developer trust is more important than clever automation.

When unsure:

- print uncertainty
- recommend manual review
- avoid writing source files
- suggest `git diff`
- keep output small

## DX Standard

The best AgentKick session should feel like:

```bash
agentkick doctor
agentkick focus --files ...
agentkick summarize --task ...
```

No ceremony. No cloud dependency. No magic claims.
