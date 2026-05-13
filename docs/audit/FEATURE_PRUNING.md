# Feature Pruning

This document classifies AgentKick features as core, postpone, remove, or reconsider.

## Core

### Repo Initialization

Keep:

- `agentkick init`
- `agentkick new`
- `agentkick add`
- generated agent files
- safe backups
- dry-run behavior

Why:

- fastest adoption path
- immediately useful
- repo-native

### Persistent Memory Scaffold

Keep:

- `.agentkick/memory/project.md`
- `.agentkick/memory/decisions.md`
- `.agentkick/memory/tasks.md`
- memory validation

Why:

- durable memory is central differentiation

### Doctor

Keep:

- readiness check
- missing memory checks
- context waste checks
- workflow checks
- safety checks
- safe fix plan

Why:

- daily habit
- visible value
- shareable output

### Context Manifest

Keep:

- avoid-load rules
- declared memory files
- task globs
- context package preview

Why:

- concrete context discipline without retrieval infrastructure

### Agent Interop Files

Keep:

- Codex
- Claude Code
- Cursor
- Copilot

Why:

- cross-agent compatibility is a real need

## Postpone

### Plugin SDK

Postpone until packs prove stable.

Reason:

- high API burden
- security and permission complexity
- premature ecosystem work

### SaaS Dashboard

Postpone until there is local usage.

Reason:

- cloud complexity
- authentication, billing, sync, privacy
- distracts from CLI trust

### Workflow Analytics

Postpone.

Reason:

- low MVP value
- easy to become vague
- can feel invasive

### VSCode Extension

Postpone.

Reason:

- duplicates CLI before CLI is excellent

### Multi-Agent Orchestration

Postpone.

Reason:

- creates agent-runtime expectations
- difficult to get right before single-task flow is strong

### Full Monorepo Migration

Postpone.

Reason:

- unnecessary until tests and internal modules become painful

### Marketplace

Postpone.

Reason:

- requires plugin maturity and community supply

## Remove From MVP Language

Remove or avoid emphasizing:

- "workflow studio"
- "fleet visibility"
- "task analytics"
- "agent runtime"
- "intelligent decomposition"
- "dependency-aware" if it implies code intelligence
- "platform" when "CLI" is more honest

These terms invite overbuilding.

## Reconsider

### Many Root Memory Files

The root-level memory set is too heavy:

- `CURRENT_TASK.md`
- `ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `FEATURE_SUMMARIES.md`
- `TASK_HISTORY.md`
- `API_CONTRACTS.md`
- `DECISIONS.md`
- `WORKFLOW_RULES.md`

Use root files only when they are agent convention files or intentionally requested.

Default to `.agentkick/memory`.

### Six Score Model

The six-score model is useful for later dashboards, but too much for MVP terminal output.

Start with one readiness score and actionable findings.

### Full State Machine

The workflow state machine is overbuilt for MVP.

Use:

```text
planned
active
blocked
done
```

## Dangerous Scope Expansions

Cut any work that requires:

- embeddings
- vector databases
- semantic indexing
- code graph infrastructure
- background cloud sync
- hosted execution
- autonomous agent scheduling
- app source refactors as automatic fixes

These directions weaken the identity.

## Adoption Friction

Features that increase friction:

- too many generated root files
- too many commands
- too many scores
- too many lifecycle names
- mandatory config before value
- plugin permissions before plugins matter
- SaaS account before CLI value

Reduce all of these.

## Differentiation Builders

Features that build uniqueness:

- `AGENTS.md` plus cross-agent files
- memory scaffold
- Doctor findings that explain agent impact
- context avoid-load manifest
- safe fix plans
- task summaries that survive chat reset

Build these first.
