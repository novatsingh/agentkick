# Architecture Audit

This audit reviews the AgentKick architecture from Prompts 1-5 and trims it back to the strongest product.

## Executive Finding

AgentKick has a clear differentiated core:

```text
repo-native workflow structure for AI-assisted development
```

The risk is not weak positioning. The risk is scope expansion.

Several documents correctly reject semantic search, vector retrieval, and GraphRAG, but later architecture layers still drift toward platform breadth: plugin registries, SaaS dashboards, workflow analytics, multi-agent coordination, VSCode panels, package workspaces, and workflow studios. Those may become useful later, but they are not the product wedge.

## Core That Should Stay

AgentKick should stay focused on five primitives:

- repo standardization
- persistent project memory
- Doctor readiness checks
- context discipline
- task execution continuity

These are enough to make AgentKick valuable.

## Strong Ideas

### `AGENTS.md` As Operating Entry

This is the simplest and most important wedge. It gives coding agents a stable repo contract.

Keep.

### Local-First Memory

Plain markdown memory files create trust and make AgentKick repo-native.

Keep, but reduce the required file set.

### Doctor

Doctor can become the daily command that explains why a repo is hard for agents to work in.

Keep, but avoid noisy scoring.

### Context Discipline

Context budgets, avoid-load rules, and task scope are distinct from retrieval tools.

Keep, but implement as explicit manifests first.

### Safe Fix Plans

`agentkick fix --plan` and `agentkick fix --safe` are high-trust developer experiences.

Keep.

## Weak Or Overbuilt Ideas

### Full Workflow State Machine

The state machine is too large for MVP. States like `compressing`, `persisting`, `handoff`, and `stale` are useful concepts, but a full engine will slow implementation.

Simplify to:

```text
planned -> active -> blocked -> done
```

### Multi-Agent Orchestration

This is premature. It risks making AgentKick look like an agent runtime.

Postpone until single-agent workflow state is excellent.

### Plugin SDK

The plugin system is directionally right but too early. It introduces permissions, manifests, locks, validation, and ecosystem surface before the core product has adoption.

Postpone. Keep packs as built-in modules first.

### SaaS Dashboard

SaaS is a monetization path, not an architecture requirement.

Postpone all hosted features until local CLI usage is proven.

### Workflow Analytics

Analytics can easily become vague and invasive.

Postpone. If added, track only local readiness trends and explicit Doctor outputs.

### VSCode Extension

Useful later, but a distraction now.

Postpone. The CLI must be strong first.

### Monorepo Package Split

The package breakdown is sound long-term, but a workspace migration before tests and schemas is unnecessary.

Postpone. Use internal module folders first.

## Duplicated Concepts

The docs repeat the same ideas under different names:

- context lifecycle
- workflow lifecycle
- execution lifecycle
- task state machine
- memory lifecycle

Simplify into one operating loop:

```text
prepare -> focus -> execute -> verify -> record
```

This loop should appear everywhere.

## Vague Terms To Reduce

Avoid overusing:

- AI-native
- operating system
- orchestration
- platform
- workflow intelligence
- execution environment

Use concrete terms:

- repo files
- memory files
- task scope
- Doctor checks
- context manifest
- verification command
- handoff summary

## Retrieval Boundary

The architecture mostly avoids retrieval, but some phrases create accidental overlap:

- "dependency-aware workflow scoping"
- "intelligent task decomposition"
- "context package"
- "workflow map"

These are acceptable only if implemented through explicit files, globs, manifests, package scripts, and user-provided scope. Do not imply semantic code understanding.

## Main Architecture Risk

The main risk is turning a strong CLI into a broad AI platform before the product has one daily habit.

The daily habit should be:

```bash
agentkick doctor
agentkick fix --plan
agentkick focus
```

If those three commands are excellent, the platform can grow.

## Audit Conclusion

AgentKick should be simpler:

- fewer required memory files
- fewer states
- fewer packages
- no SaaS in MVP
- no plugin SDK in MVP
- no multi-agent orchestration in MVP
- no IDE extension in MVP

AgentKick becomes unique by making repos operationally ready for coding agents, not by becoming another large AI platform.
