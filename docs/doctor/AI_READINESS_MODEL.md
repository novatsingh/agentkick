# AI Readiness Model

AI Readiness measures how prepared a repository is for high-quality AI-assisted software development.

It is not code quality in the traditional sense. A repo can pass tests and still be hostile to coding agents. A repo can be small and still lack memory, task boundaries, or execution continuity.

AgentKick Doctor evaluates the repository as an operating environment for agents.

## Readiness Dimensions

The model has six top-level scores:

```text
AI Readiness Score
Workflow Stability Score
Context Complexity Score
AI Maintainability Score
Token Waste Risk Score
Execution Isolation Score
```

Each score maps to conditions that affect coding-agent performance.

## 1. AI Readiness Score

The executive score.

It answers:

```text
Can a capable coding agent enter this repo and work without repeated human explanation?
```

Inputs:

- memory coverage
- workflow clarity
- context budget health
- execution isolation
- agent file coverage
- verification path availability
- stale memory risk

Interpretation:

```text
90-100  agent-native
80-89   ready
70-79   usable with friction
60-69   fragile
0-59    agent-hostile
```

## 2. Workflow Stability Score

Measures whether repeated agent work can follow a predictable path.

Signals:

- `WORKFLOW_RULES.md` exists and has required sections
- test command documented
- build command documented
- review workflow defined
- memory update workflow defined
- release/deploy workflow defined when relevant
- CI present or documented
- destructive actions require approval
- verification outcomes are recorded in task history

Low score means:

- agents will improvise process
- verification will be inconsistent
- handoffs will vary by tool
- users will repeat workflow instructions

## 3. Context Complexity Score

Measures how much unnecessary context an agent must load to complete common tasks.

High score means low complexity.

Signals:

- source files within size budgets
- memory files within budgets
- feature summaries scoped
- large features split into feature memory files
- generated/vendor/build files excluded
- entry points are small and directional
- architecture boundaries are documented
- current task scope is explicit

Low score means:

- small changes require large context
- agents read unrelated code
- long threads degrade quickly
- task focus collapses

## 4. AI Maintainability Score

Measures how easy it is for agents to reason about and safely modify the repo.

Signals:

- clear folder organization
- predictable naming
- modular files
- low cross-feature coupling
- limited duplicated business logic
- contract boundaries documented
- architecture memory current
- decisions recorded
- tests map to feature zones

Low score means:

- agents may patch the wrong layer
- similar logic gets changed inconsistently
- refactors become risky
- reviews require more human correction

## 5. Token Waste Risk Score

Measures the likelihood that agents burn tokens on avoidable context.

High score means high risk.

Signals:

- giant files
- huge memory files
- raw logs in docs
- repeated instructions across files
- missing feature summaries
- missing API contracts
- task history not compacted
- generated output inside default context
- broad agent instructions without priority

Interpretation:

```text
0-29    low waste
30-59   moderate waste
60-79   high waste
80-100  severe waste
```

This score is inverted compared to readiness scores because it represents risk.

## 6. Execution Isolation Score

Measures whether tasks can be scoped, executed, verified, and reviewed independently.

Signals:

- active task file or task manifest
- feature boundaries visible
- tests near affected behavior
- scripts can target relevant checks
- app layers separated
- shared utilities documented
- workflows define allowed tools and commands
- code changes can avoid broad unrelated files

Low score means:

- agents touch too much
- verification is expensive
- small tasks become broad rewrites
- review diffs are harder to trust

## Readiness Inputs

Doctor should collect readiness signals from:

- AgentKick memory files
- agent instruction files
- package manifests
- CI configuration
- source file structure
- test layout
- docs and workflow files
- task files
- pack configuration
- plugin contributions

Doctor should avoid interpreting business intent without explicit memory.

## Readiness Anti-Patterns

### The Giant Entry Point

One file contains routing, API calls, state management, UI, feature flags, and error handling.

Agent impact:

- every change loads the entire app shell
- agents patch locally instead of improving boundaries
- context window fills with unrelated state

### The Invisible Product

Features exist in code but not in `FEATURE_SUMMARIES.md`.

Agent impact:

- agents rediscover behavior from source
- edge cases are missed
- user repeats product explanation

### The Undocumented Contract

APIs exist but there is no `API_CONTRACTS.md`.

Agent impact:

- clients and servers drift
- agents change response shapes without seeing compatibility risk
- error behavior becomes inconsistent

### The Thread-Only Memory

Important project decisions live only in chat.

Agent impact:

- new threads lose continuity
- contradictory decisions return
- long conversations become required infrastructure

### The Workflow Fog

No clear test, build, review, deploy, or memory update workflow.

Agent impact:

- agents guess commands
- verification gets skipped
- output quality depends on prompt detail

## Readiness Levels

### Level 0: Unprepared

Traits:

- no agent files
- no memory files
- no documented commands
- giant mixed files
- unclear repo purpose

Agent behavior:

- asks many basics
- guesses workflow
- needs constant supervision

### Level 1: Agent-Aware

Traits:

- `AGENTS.md`
- basic commands
- some agent-specific files

Agent behavior:

- can start but lacks continuity
- repeated task context still needed

### Level 2: Memory-Backed

Traits:

- core memory files exist
- feature and contract summaries present
- task history starts accumulating

Agent behavior:

- fewer repeated explanations
- better thread reset behavior

### Level 3: Workflow-Ready

Traits:

- workflow rules are clear
- task boundaries defined
- verification reliable
- context budgets respected

Agent behavior:

- predictable execution
- safer delegation
- lower token waste

### Level 4: Agent-Native

Traits:

- feature-scoped memory
- task orchestration
- strong execution isolation
- compact history
- clear package boundaries
- Doctor score stays high over time

Agent behavior:

- agents can work with minimal prompt scaffolding
- handoffs survive resets
- workflow quality compounds

## Model Philosophy

AI readiness is not a one-time setup. It is an operational posture.

Every feature, refactor, and release can improve or damage readiness. Doctor should make that visible before the repo becomes expensive for agents to reason about.
