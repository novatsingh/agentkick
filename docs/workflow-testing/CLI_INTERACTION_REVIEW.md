# CLI Interaction Review

This document reviews the command surface from the perspective of daily use.

## Command Surface Diagnosis

The architecture contains more commands than the MVP should expose.

The danger is not implementation complexity alone. The danger is that users cannot tell which command matters.

## MVP Command Set

Keep:

```bash
agentkick new
agentkick init
agentkick add
agentkick doctor
agentkick fix --plan
agentkick fix --safe
agentkick focus
agentkick summarize
```

This is still more than ideal, but each command has a clear role:

| Command | Role | Frequency |
| --- | --- | --- |
| `new` | create starter repo | occasional |
| `init` | upgrade existing repo | once per repo |
| `add` | add built-in workflow pack | occasional |
| `doctor` | inspect AI workflow health | daily |
| `fix --plan` | preview safe AgentKick changes | as needed |
| `fix --safe` | apply safe AgentKick changes | as needed |
| `focus` | prepare scoped context | per task |
| `summarize` | record task result or handoff | per task |

## Commands To Postpone

Postpone:

```bash
agentkick analyze
agentkick score
agentkick workflow-report
agentkick prepare-task
agentkick split-task
agentkick continue
agentkick reset-context
agentkick compact
agentkick workflow-state
agentkick plugin
```

## Why To Postpone Them

### `analyze`

Problem:

- overlaps with `doctor`

MVP replacement:

- `doctor --deep` later if needed

### `score`

Problem:

- score-only output is less useful than findings

MVP replacement:

- `doctor --json` for CI and automation

### `workflow-report`

Problem:

- sounds like a report generator
- likely ignored by fast-moving developers

MVP replacement:

- concise Doctor output with `--json` for integrations

### `prepare-task`

Problem:

- asks users to adopt AgentKick's task model too early

MVP replacement:

- `focus --task` or `focus --files`

### `split-task`

Problem:

- task decomposition is valuable but subjective
- risks becoming prompt engineering

MVP replacement:

- Doctor can recommend narrower scope in plain language

### `continue`

Problem:

- requires reliable task state first

MVP replacement:

- `focus --task` using existing task memory

### `reset-context`

Problem:

- too similar to summarize and compact

MVP replacement:

- `summarize --handoff`

### `compact`

Problem:

- memory compaction can destroy useful context if automated too early

MVP replacement:

- Doctor flags oversized memory
- user manually reviews compaction

### `workflow-state`

Problem:

- exposes internal model

MVP replacement:

- `doctor` shows stale task and continuity issues

### `plugin`

Problem:

- plugin SDK before strong packs adds supply-side complexity

MVP replacement:

- built-in `agentkick add <pack>`

## Recommended Daily Flows

### Existing Repo First Run

```bash
npx agentkick doctor
npx agentkick init --minimal
git diff
npx agentkick doctor
```

### Before Asking An Agent To Fix A Bug

```bash
agentkick focus --files src/popup.js popup.html
```

Then paste the focus output into Codex, Cursor, Claude Code, or Copilot.

### After A Task

```bash
agentkick summarize --task "Fix popup CTA"
git diff
```

### CI Later

```bash
agentkick doctor --strict --json
```

Do not push strict mode before local trust exists.

## CLI Fatigue Risks

### Too Many Next Commands

Bad:

```text
Next:
  agentkick analyze
  agentkick score
  agentkick workflow-report
  agentkick fix --plan
```

Good:

```text
Next:
  agentkick fix --plan
```

### Too Much Explanation

Bad:

- long philosophy in terminal
- full architecture terms
- repeated product positioning

Good:

- one-line agent impact
- one recommended fix
- one next command

### Too Much Interactivity

Interactive prompts are useful, but default flows should work non-interactively.

Reason:

- agents need predictable commands
- CI needs stable output
- users paste commands into terminals

## Output Standards

Every command should include:

- command name
- files inspected or changed
- source files changed status
- top finding or result
- next command

Every write command should include:

- dry-run mode
- exact file list
- backup behavior
- no source change statement when true

Every risky operation should require:

- explicit flag
- clear explanation
- reversible plan where possible

## Agent Interop UX

AgentKick should output text that can be pasted into any coding agent.

Example:

```text
Agent task scope:
Read AGENTS.md and WORKFLOW_RULES.md first.
Work only in popup.html and popup.js unless investigation proves another file is required.
Avoid dist/, release zips, and generated assets.
Verify with npm test and manual popup check.
Record result with agentkick summarize --task "Fix popup CTA".
```

This is more useful than a proprietary task object in MVP.

## Naming Review

Keep:

- `doctor`
- `focus`
- `summarize`
- `fix --plan`
- `fix --safe`

Use carefully:

- `add`
- `new`

Avoid for MVP:

- `orchestrate`
- `pipeline`
- `workflow-state`
- `agent-runtime`
- `intelligence`

## Interaction Conclusion

The CLI should converge on one daily habit:

```bash
agentkick doctor
```

Then two task habits:

```bash
agentkick focus --files ...
agentkick summarize --task ...
```

If those three commands become useful, the rest of AgentKick can grow from real demand.
