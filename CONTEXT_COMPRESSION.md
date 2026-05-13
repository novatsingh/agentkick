# Context Compression

Context Compression converts temporary execution noise into durable project memory.

It is the mechanism that lets AgentKick survive long workflows, thread resets, and multi-agent handoffs without storing chat transcripts.

## Compression Philosophy

Compression is not summarizing everything.

Compression is selecting durable signal:

- what changed
- why it changed
- what was verified
- what remains risky
- what future agents must know

## Compression Inputs

Inputs:

- task plan
- changed files
- command outputs
- errors
- review notes
- decisions
- scope expansions
- verification results
- user corrections
- agent handoffs

## Compression Outputs

Outputs:

- `CURRENT_TASK.md` handoff
- `TASK_HISTORY.md` entry
- feature memory update
- API contract update
- decision entry
- workflow timeline event
- stale context marker

## Compression Levels

### Level 0: No Compression

Temporary execution state remains active.

Use only during short execution.

### Level 1: Handoff Compression

For thread reset or agent transfer.

Contains:

- current goal
- completed steps
- changed files
- blockers
- next step
- verification status

### Level 2: Task Completion Compression

For closing a task.

Contains:

- result
- files changed
- verification
- memory updates
- follow-up

### Level 3: Feature Compression

For long-term feature memory.

Contains:

- current behavior
- edge cases
- primary files
- contracts
- tests
- known risks

### Level 4: Release Compression

For release or milestone memory.

Contains:

- shipped changes
- migrations
- changed workflows
- compatibility notes
- release verification

## Handoff Summary Template

```markdown
# Handoff Summary

## Current Goal

## Completed

## Changed Files

## Open Blockers

## Next Step

## Verification

## Context To Reload
```

## Task History Template

```markdown
### 2026-05-13 - TASK-123 - Fix checkout coupon validation

- Result:
- Files:
- Verification:
- Scope changes:
- Memory updates:
- Follow-up:
```

## Compression Heuristics

Keep:

- accepted decisions
- final implementation behavior
- user-visible behavior changes
- changed contract shapes
- verification commands and results
- unresolved blockers
- follow-up risks

Drop:

- failed attempts after root cause is known
- raw terminal logs
- duplicate reasoning
- speculative alternatives not chosen
- repeated file listings
- old plan steps superseded by final plan

Mark stale:

- contradicted memory
- obsolete task scopes
- old current task state
- superseded decisions
- outdated workflow commands

## Automatic Context Cleanup

The engine should clean active context after checkpoints.

Cleanup events:

- task split
- verification passed
- blocker resolved
- scope changed
- task completed
- thread reset
- workflow closed

Actions:

- remove raw execution notes from active context
- compress command output
- update timeline
- move durable facts to memory
- archive old task file if needed

## Workflow Compression Logic

Parent workflows compress children:

```text
Child task outcomes
  -> parent timeline
  -> parent completion summary
  -> feature or architecture memory
```

Parent should not copy full child notes.

Compression fields:

- child task id
- result
- verification
- memory impact
- remaining risk

## Stale Context Detection

Stale context indicators:

- active task older than threshold
- file references missing
- verification output older than changed files
- child task completed but parent still marks it pending
- API contract changed but feature memory not updated
- handoff says blocked but blocker no longer exists

Stale action:

- mark stale
- request refresh
- exclude from default package until reviewed

## CLI: `agentkick summarize`

```bash
agentkick summarize --task TASK-123
agentkick summarize --handoff
agentkick summarize --changed-files
```

Example output:

```text
AgentKick Summarize

Compressed active execution into handoff.

Kept
  goal, changed files, blocker, next step, verification

Dropped
  3 failed command attempts after root cause was identified
  raw stack trace now summarized

Updated
  CURRENT_TASK.md
```

## CLI: `agentkick compact`

```bash
agentkick compact --tasks
agentkick compact --feature billing
agentkick compact --history --older-than 30d
```

Example:

```text
AgentKick Compact

TASK_HISTORY.md is 620 lines.

Plan
  keep last 10 tasks expanded
  compress older 27 tasks into monthly summaries
  preserve verification and memory update references

No files changed. Run with --apply.
```

## Compression Safety

Compression must not:

- erase unresolved blockers
- convert assumptions into facts
- delete raw evidence before review when debugging is active
- overwrite decisions
- hide failed verification
- remove user instructions from current task

## Product Standard

Good compression makes the next agent faster without making the project less truthful.

The compressed memory should be smaller, clearer, and more durable than the conversation it replaced.
