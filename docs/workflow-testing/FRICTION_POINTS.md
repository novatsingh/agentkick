# Friction Points

This document identifies the points where developers are likely to resist, ignore, or misunderstand AgentKick.

## First-Run Friction

### "Will This Mess Up My Repo?"

Concern:

- `init` writes files into a repo the developer already cares about.

Required product behavior:

- dry-run preview
- minimal default scaffold
- clear backup behavior
- no app source edits
- visible file list before writes

Bad output:

```text
Initialized AgentKick workflow system.
```

Better output:

```text
No source files changed.
Created 4 workflow files and 1 context manifest.
Next: git diff
```

### "Why Are There So Many Markdown Files?"

Concern:

- AgentKick looks like documentation work, not execution help.

Required product behavior:

- hide optional memory in `.agentkick/memory`
- keep root clean
- explain each file in one line
- generate optional files only from packs or explicit flags

### "Do I Need To Learn A Workflow?"

Concern:

- Developers are already busy inside Cursor, Codex, Claude Code, or Copilot.

Required product behavior:

- one command after clone: `agentkick doctor`
- one command before a task: `agentkick focus --files ...`
- one command after a task: `agentkick summarize --task ...`

## Terminology Friction

Terms likely to confuse:

- workflow operating system
- execution orchestration
- context lifecycle
- memory lifecycle
- agent pipelines
- workflow state machine
- intelligence layer

Terms developers understand:

- repo memory
- task scope
- files to read
- files to avoid
- safe fix plan
- verification command
- stale task

Rule:

Use big positioning language in marketing docs. Use simple operational language in CLI output.

## Command Friction

### Commands Developers Will Use

Likely daily usage:

```bash
agentkick doctor
agentkick fix --plan
agentkick focus --files ...
agentkick summarize --task ...
```

Setup usage:

```bash
agentkick init
agentkick add chrome-extension
```

### Commands Developers Will Ignore In MVP

Likely ignored:

```bash
agentkick analyze
agentkick score
agentkick workflow-report
agentkick prepare-task
agentkick split-task
agentkick continue
agentkick workflow-state
agentkick compact
agentkick plugin
```

Reason:

- they overlap with stronger commands
- they require users to understand AgentKick internals
- they feel like process before value

Correction:

- `doctor` includes analysis, score, and next action
- `focus` covers task preparation
- `summarize` covers reset and continuation support
- `plugin` waits until built-in packs prove demand

## Cognitive Load Friction

### Too Many Scores

Six scores look precise but can slow decision-making.

MVP should show:

```text
AI readiness: 82/100
Top risks: 3
Next command: agentkick fix --plan
```

Secondary labels are enough:

- memory gap
- context risk
- workflow gap
- safety risk

### Too Many Priorities

P0 through P5 can work internally, but output should stay practical:

```text
Fix now
Fix next
Watch
```

Detailed priority codes can appear in JSON and CI output.

## Repo Complexity Friction

### Messy Existing Repos

Common conditions:

- old docs
- generated files committed
- huge components
- unclear package manager
- no tests
- stale TODOs

AgentKick should not require a clean repo before helping.

Doctor should produce a first useful step even in chaos.

### Monorepos

Common conditions:

- many apps
- shared packages
- mixed scripts
- inconsistent ownership

AgentKick should not pretend to solve monorepo intelligence in MVP.

It should:

- accept explicit folder scopes
- detect package manifests
- show uncertainty
- avoid semantic dependency promises

## Memory Maintenance Friction

### Developers Forget To Update Memory

Real behavior:

- task ends
- user moves on
- memory remains stale

Mitigation:

- `doctor` should detect stale memory and stale current tasks
- `summarize` should be fast enough to use
- CLI should print a short post-task reminder when files changed

### Developers Reject Memory PR Noise

Real behavior:

- reviewers see memory diffs as noise

Mitigation:

- memory updates must be concise
- task history entries should be one compact block
- avoid generated timestamps in many files
- do not rewrite entire memory files for small changes

## Setup Friction

### Package Manager Differences

AgentKick must handle:

- npm
- pnpm
- yarn
- bun
- no package manager

Doctor should not fail just because scripts are missing. It should say what verification is unknown.

### Windows And Synced Folders

Real friction:

- OneDrive path locks
- backup write failures
- long paths
- PowerShell script policy

Mitigation:

- clear filesystem errors
- no vague "init failed"
- write plans before backups
- support retry with alternate backup location

## Adoption Friction

### "We Already Have Docs"

Answer:

- AgentKick does not replace docs.
- It creates the short operational memory agents should read first.

### "Our Agents Already Work"

Answer:

- AgentKick is most valuable when threads reset, tasks span days, or multiple agents touch the repo.

### "This Looks Like Process"

Answer:

- The daily loop should be under one minute.
- No ceremony should be required to get the first Doctor result.

## Friction Conclusion

Every extra file, command, score, and term must earn its place.

The product should feel like a small operating layer that removes repeated explanation, not a methodology developers must adopt.
