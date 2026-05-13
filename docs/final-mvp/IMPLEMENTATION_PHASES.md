# Implementation Phases

This document defines the build order for AgentKick v1.

## Phase 0: Stabilize The Current CLI

Estimate: 1-2 days.

Goal:

- make the existing CLI safe to change
- preserve current scaffold behavior
- create confidence before adding workflow commands

Work:

- add focused tests around command routing
- add tests around file writes and backups
- confirm Windows PowerShell usage with `npm.cmd`
- keep `new` and `add` working, but remove them from launch positioning

Exit criteria:

- `npm.cmd test` passes
- CLI errors are deterministic
- docs match the locked v1 command set

## Phase 1: Minimal Init

Estimate: 3-4 days.

Goal:

- make `agentkick init` produce a small, trustworthy repo diff

Work:

- implement `--dry-run`
- implement `--minimal` as default behavior
- generate required v1 files
- add managed sections to `AGENTS.md`
- write `.agentkick.json`
- add context exclusions
- preserve backups before overwrites
- ensure no app source files are touched

Exit criteria:

- init can run on an existing repo without clutter
- output says exactly what changed
- `git diff` is easy to review

## Phase 2: Doctor v1

Estimate: 5-7 days.

Goal:

- make `agentkick doctor` the daily habit

Work:

- inspect stack indicators
- inspect agent files
- inspect memory files
- inspect package scripts and common build/test commands
- detect generated/vendor exposure
- detect large source files with line counts
- detect stale or oversized memory
- produce one readiness score
- produce top findings with agent impact
- support `--json`
- support `--strict`

Exit criteria:

- Doctor is useful before init
- Doctor recommends one next command
- findings are specific to AI workflow quality

## Phase 3: Focus v1

Estimate: 4-5 days.

Goal:

- make a task context brief that developers can paste into any agent

Work:

- read `.agentkick/context/manifest.json`
- support `--files`
- support `--feature`
- support `--task`
- classify read-first memory
- print avoided paths
- print verification command when known
- output human text and JSON

Exit criteria:

- explicit file scope works without task setup
- output is shorter than a prompt essay
- focus does not imply semantic retrieval

## Phase 4: Summarize v1

Estimate: 4-5 days.

Goal:

- make task handoff and thread reset practical

Work:

- accept task title
- accept status fields
- write compact entry to `.agentkick/memory/tasks.md`
- support `--handoff`
- require verification status
- prevent raw log dumps
- detect missing changed-file summary

Exit criteria:

- a new agent can resume from the summary
- task memory stays compact
- blocked tasks are clearly marked

## Phase 5: Split-Task v1

Estimate: 4-6 days.

Goal:

- reduce broad AI prompts into scoped execution steps

Work:

- accept text task
- accept explicit files
- use repo profile and context manifest
- output 2-5 subtasks
- mark dependencies
- mark suggested verification per subtask
- optionally write `.agentkick/tasks/<task-id>.md`

Exit criteria:

- broad tasks become smaller without pretending to understand code semantically
- each subtask has a clear scope and non-goals
- output can be pasted into coding agents

## Phase 6: README And Launch Polish

Estimate: 2-3 days.

Goal:

- make GitHub visitors understand and try AgentKick quickly

Work:

- rewrite README around the five v1 commands
- add GIF or terminal transcript
- add before/after repo memory example
- add "what AgentKick is not"
- add install and local development instructions
- add contribution rules

Exit criteria:

- README explains value in under one minute
- first command is obvious
- product boundary is clear

## Hardest Engineering Risks

| Risk | Why Hard | Mitigation |
| --- | --- | --- |
| Safe writes | Users fear repo damage | dry-run, backups, managed sections |
| Doctor signal quality | Generic findings kill trust | require agent impact per finding |
| Summary quality | Memory can become noisy | strict summary templates |
| Focus accuracy | Users expect retrieval | explicit scope, uncertainty language |
| Cross-platform filesystem | Windows and synced folders fail differently | clear errors and alternate backup dir |

## Implementation Rule

Build the command that earns trust first, then build the command that saves context.
