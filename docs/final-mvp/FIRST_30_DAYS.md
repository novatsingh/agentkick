# First 30 Days

This document defines the execution plan for the first 30 days of AgentKick v1 development.

## Day 1-3: Lock Repo And Tests

Goals:

- freeze v1 command scope
- confirm package scripts
- protect existing scaffolds
- add regression tests around current behavior

Tasks:

- update README draft to match v1
- add tests for command routing
- add tests for write plans
- add tests for Doctor output shape
- document Windows usage with `npm.cmd`

Deliverable:

- stable baseline for v1 work

## Day 4-8: Init

Goals:

- make repo initialization small and safe

Tasks:

- implement `agentkick init --dry-run`
- make minimal scaffold default
- write `.agentkick.json`
- write `.agentkick/memory/project.md`
- write `.agentkick/memory/decisions.md`
- write `.agentkick/memory/tasks.md`
- write `.agentkick/context/manifest.json`
- update or create `AGENTS.md`
- update or create `WORKFLOW_RULES.md`
- add backup and managed-section tests

Deliverable:

- first-run diff developers can trust

## Day 9-15: Doctor

Goals:

- make Doctor useful on messy repos

Tasks:

- implement uninitialized repo scan
- detect missing agent files
- detect missing memory files
- detect missing test/build commands
- detect generated path exposure
- detect oversized files
- detect stale task memory
- output one readiness score
- output top findings
- output one next command
- implement `--json`
- implement `--strict`

Deliverable:

- `agentkick doctor` becomes the daily command

## Day 16-20: Focus

Goals:

- make agent context preparation practical

Tasks:

- parse context manifest
- support `--files`
- support `--feature`
- support `--task`
- print read-first files
- print task files
- print avoid paths
- print verification command
- add JSON output if cheap

Deliverable:

- focus output can be pasted into Codex, Cursor, Claude Code, or Copilot

## Day 21-24: Summarize

Goals:

- make thread reset and handoff reliable

Tasks:

- implement compact task entry writer
- require task title
- support complete, blocked, and handoff status
- include files changed
- include verification
- include follow-up
- prevent raw log blocks

Deliverable:

- `.agentkick/memory/tasks.md` becomes useful continuity memory

## Day 25-27: Split-Task

Goals:

- reduce broad AI prompts before execution

Tasks:

- implement text task parsing
- implement explicit file/folder scope input
- output 2-5 subtasks
- include dependency notes
- include verification per subtask
- include non-goals
- optionally write task files

Deliverable:

- developers can turn "build checkout flow" into scoped agent-ready chunks

## Day 28-30: Launch Polish

Goals:

- prepare open-source release

Tasks:

- rewrite README
- add terminal transcript
- add demo repo example
- add launch checklist
- run package dry run
- run tests on Windows
- verify GitHub repo cleanliness

Deliverable:

- public v1-ready repository

## 30-Day Success Metrics

Target:

- `agentkick init` completes in under 10 seconds on normal repos
- Doctor output is useful in under 30 seconds
- first-run generated diff is under 8 files
- focus output is under 120 lines
- summary entry is under 12 lines
- split-task output is 2-5 concrete subtasks

## 30-Day Rule

Do not build anything that does not improve the first local workflow loop.
