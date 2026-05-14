# Final MVP

This document locks the true AgentKick MVP.

AgentKick v1 is a local-first repo readiness layer for AI-assisted development. It makes a repository easier for coding agents to enter, scope, verify, and resume without depending on giant chat history.

## Final Product Definition

AgentKick v1 is a local-first CLI that adds:

- agent operating files
- durable repo memory
- AI workflow readiness checks
- explicit context scope
- compact task continuity
- lightweight task splitting
- secondary starter-project templates and workflow packs

It does not add:

- semantic search
- vector retrieval
- GraphRAG
- hosted execution
- plugin marketplace
- SaaS dashboard
- autonomous multi-agent runtime
- automatic app source refactors

## MVP Promise

```text
Make an existing repo ready for AI-assisted development in under five minutes.
```

A developer should be able to run:

```bash
agentkick init
agentkick doctor
agentkick focus auth
agentkick summarize
```

and immediately understand:

- what agents should read
- what agents should avoid
- what workflow memory exists
- what makes the repo hard for agents
- how to hand off work after a thread reset

## Commands That Ship In v1

The implemented v1 launch command set is:

```bash
agentkick init
agentkick doctor
agentkick focus
agentkick split-task
agentkick summarize
```

Support flags:

```bash
agentkick init --dry-run
agentkick doctor --strict
agentkick doctor --json
agentkick doctor --debug
agentkick focus <scope>
agentkick split-task "<task>"
agentkick split-task "<task>" --files <paths...>
agentkick split-task "<task>" --json
agentkick summarize <scope>
```

## Secondary Commands

Existing scaffolding commands remain available, but they are not the launch identity:

```bash
agentkick new
agentkick add
```

They support teams that want new agent-ready starter projects or stack-specific workflow packs.

## Commands Not In The v1 Story

Postpone:

```bash
agentkick analyze
agentkick score
agentkick workflow-report
agentkick prepare-task
agentkick continue
agentkick reset-context
agentkick compact
agentkick workflow-state
agentkick plugin
```

Reason:

- `doctor` owns readiness, scoring, and report output.
- `focus` owns task context preparation.
- `summarize` owns reset and handoff support.
- `split-task` owns lightweight task decomposition.

## v1 Generated Files

Required:

```text
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
.cursor/rules/*
.github/copilot-instructions.md
.github/instructions/*
.codex/agents/*
.claude/commands/*
.claude/skills/*
.claude/agents/*
.agents/skills/*
```

These files are intentionally plain markdown and JSON so the first init diff is reviewable.

## v1 Workflow Loop

```text
prepare -> diagnose -> focus -> execute -> summarize
```

### Prepare

Run:

```bash
agentkick init
```

Outcome:

- repo has agent operating instructions
- repo has minimal memory files
- generated/vendor paths are excluded from default context

### Diagnose

Run:

```bash
agentkick doctor
```

Outcome:

- one AI readiness score
- top workflow risks
- top context waste risks
- next command

### Focus

Run:

```bash
agentkick focus popup
```

Outcome:

- paste-ready agent context brief
- files to read
- files to avoid
- verification command

### Execute

The developer uses Codex, Cursor, Claude Code, Copilot, Windsurf, or another agent.

AgentKick does not run the agent.

### Summarize

Run:

```bash
agentkick summarize
```

Outcome:

- compact task result
- verification state
- changed files
- follow-up
- reset-ready handoff

## v1 Split-Task Position

`split-task` ships because broad prompts are one of the biggest causes of AI failure.

It must stay lightweight.

It does:

- turn one broad task into 2-5 scoped execution steps
- suggest file or folder ownership
- mark dependencies between steps
- show what can be done first
- output agent-ready task briefs

It does not:

- schedule agents
- assign agents automatically
- create background jobs
- infer semantic code ownership
- guarantee merge conflict prevention

## Token Optimization Behavior

AgentKick v1 reduces token waste through explicit rules:

- always load `AGENTS.md` and `WORKFLOW_RULES.md`
- load compact root workflow memory
- prefer explicit scope names such as `agentkick focus auth`
- exclude generated, vendor, build, coverage, release, and cache paths
- summarize task outcomes instead of storing raw logs
- flag memory files over budget
- flag stale task state

No embeddings. No vector search. No semantic retrieval.

## v1 Success Criteria

AgentKick v1 is successful when:

- first init diff is easy to review
- Doctor produces useful output before full setup
- Focus output can be pasted into any coding agent
- Summaries are short enough to become habit
- `split-task` reduces oversized AI requests without creating bureaucracy
- the README explains the product in under one minute

## Final MVP Rule

If a feature does not make agents read less, start faster, verify better, or resume more safely, it does not ship in v1.
