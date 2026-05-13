# Task Decomposition

Task Decomposition turns broad user requests into safe, focused execution units.

The goal is not bureaucracy. The goal is to reduce context waste, isolate risk, and make agent work resumable.

## Decomposition Philosophy

Large prompts create large context. Large context creates weak execution.

AgentKick decomposes by:

- feature
- execution zone
- contract boundary
- workflow phase
- risk level
- verification path
- agent specialization

## When To Decompose

Decompose when a task:

- touches more than one feature
- crosses frontend and backend
- changes API contracts
- changes architecture
- requires multiple verification commands
- includes UI and data model work
- has unclear scope
- risks long-thread degradation
- cannot be completed in one focused agent pass

Do not decompose when:

- change is one file and one behavior
- verification is narrow
- memory impact is none or trivial
- splitting would create coordination overhead without reducing risk

## Decomposition Axes

### By Feature

Use when features are independent.

Example:

```text
Parent: improve marketplace seller onboarding
Child: seller profile form
Child: document upload flow
Child: approval status UI
Child: admin review API
```

### By Layer

Use when one feature crosses layers.

Example:

```text
Parent: add billing seat limit
Child: API contract
Child: backend enforcement
Child: frontend messaging
Child: tests and memory
```

### By Execution Zone

Use in monorepos or modular apps.

Example:

```text
Parent: update AgentKick Doctor scoring
Child: packages/doctor
Child: packages/context
Child: docs
Child: fixtures
```

### By Risk

Use when one part is high-risk.

Example:

```text
Parent: migrate auth session behavior
Child: document current contract
Child: safe UI copy update
Child: high-risk token refresh refactor
Child: compatibility tests
```

### By Agent Type

Use when different agents should own different work.

Example:

```text
Child: docs researcher
Child: implementation worker
Child: reviewer
Child: test writer
```

## Decomposition Output

Task split should produce:

- parent task id
- child task ids
- dependency order
- inherited constraints
- per-child scope
- required memory
- verification command
- expected memory update

Template:

```yaml
parent: TASK-100
children:
  - id: TASK-101
    title: Update API contract
    zone: backend.contracts
    depends_on: []
    memory:
      - API_CONTRACTS.md
    verification:
      - npm.cmd test -- api
  - id: TASK-102
    title: Update frontend client
    zone: frontend.billing
    depends_on:
      - TASK-101
```

## Intelligent Task Decomposition

AgentKick can propose decomposition from:

- user request wording
- detected stack
- memory files
- execution zones
- feature summaries
- API contract references
- Doctor findings
- package structure

It should not infer hidden business behavior without memory or user input.

## AI-Safe Task Boundaries

A child task is AI-safe when:

- goal is clear
- scope is small
- non-goals are explicit
- files are known or discoverable within zone
- verification path exists
- memory impact is known
- dependencies are declared
- rollback or review risk is visible

If these are missing, the task should remain in planning state.

## Split CLI

```bash
agentkick split-task TASK-123
agentkick split-task TASK-123 --by feature
agentkick split-task TASK-123 --by layer
agentkick split-task TASK-123 --by zone
agentkick split-task TASK-123 --interactive
```

Example output:

```text
AgentKick Split Task

Parent
  TASK-123 Add marketplace seller onboarding

Proposed children
  TASK-124 API contract and persistence
  TASK-125 Seller onboarding UI
  TASK-126 Admin review workflow
  TASK-127 Tests and memory updates

Shared constraints
  Preserve existing buyer onboarding.
  Do not change payment flow.

Apply split
  agentkick split-task TASK-123 --apply
```

## Dependency Rules

- Contract tasks run before implementation tasks.
- Architecture decisions run before broad refactors.
- Backend behavior runs before frontend client assumptions.
- Design system changes run before UI implementation.
- Verification and memory tasks run after implementation.
- Review can run after each child or after parent completion.

## Parent Task Compression

When children complete, parent task should store:

- child outcomes
- verification summary
- unresolved risks
- durable memory updates
- final result

It should not duplicate every child execution note.

## Example: AI Automation Platform

Request:

```text
Add workflow retry policies to automation runs.
```

Decomposition:

```text
TASK-201 Define retry contract
TASK-202 Add orchestrator state support
TASK-203 Update run timeline UI
TASK-204 Add tests for retry state transitions
TASK-205 Update workflow memory and API contracts
```

Context effect:

- each task loads one execution zone
- shared contract inherited
- raw logs stay local to each child
- parent compresses final workflow behavior

## Product Standard

A decomposed task should feel smaller, safer, and easier to resume.

If decomposition increases confusion, the split is wrong.
