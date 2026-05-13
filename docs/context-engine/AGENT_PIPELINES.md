# Agent Pipelines

Agent Pipelines define repeatable execution flows for AI coding agents.

A pipeline is a structured path from task intake to memory persistence. It tells AgentKick which context to load, which agent role should act, what verification is required, and what memory must be updated.

## Pipeline Model

```text
trigger -> prepare -> focus -> execute -> verify -> review -> compress -> persist
```

Each stage has:

- inputs
- outputs
- allowed context
- allowed tools
- required state update

## Pipeline Types

### Bug Fix Pipeline

Stages:

```text
classify bug
load feature memory
load failing files and tests
execute narrow patch
verify reproduction or test
update task history
update feature memory if behavior changed
```

Context:

- P0 operating context
- `CURRENT_TASK.md`
- relevant feature memory
- failing files
- nearest tests

### Feature Pipeline

Stages:

```text
define feature goal
decompose by layer
load feature package
update or create contracts
execute child tasks
verify each layer
compress into feature summary
```

Context:

- feature memory
- architecture
- API contracts
- design system if UI
- zone files

### Refactor Pipeline

Stages:

```text
define behavior lock
load architecture and decisions
scope boundaries
execute small moves
verify behavior
update architecture memory
record decision if durable
```

### Security Review Pipeline

Stages:

```text
load security workflow
define source and sink scope
inspect relevant contracts
validate exploitability
report findings
propose fixes
update task history
```

### Release Pipeline

Stages:

```text
load workflow rules
load task history since last release
verify build and tests
check memory updates
prepare release summary
persist release memory
```

## Agent Roles

Pipelines may map steps to roles:

- planner
- implementer
- reviewer
- test writer
- docs updater
- security auditor
- release operator

AgentKick should not require separate model processes. Roles are execution modes with context packages.

## Handoff Between Agents

Handoff rules:

- source agent must summarize state
- target agent receives context package, not full chat
- changed files and verification state are mandatory
- raw logs are excluded unless needed
- parent workflow timeline records handoff

Handoff example:

```text
Planner -> Implementer
  gives: task scope, feature memory, plan

Implementer -> Test Writer
  gives: changed files, expected behavior, verification gap

Test Writer -> Reviewer
  gives: tests added, command results, remaining risk
```

## Pipeline State File

```yaml
id: PIPE-123
task: TASK-123
type: feature
status: executing
current_stage: execute
agents:
  planner: completed
  implementer: executing
  reviewer: pending
context_package: .agentkick/context/packages/TASK-123.json
timeline:
  - prepared
  - focused
  - split
```

## CLI Examples

```bash
agentkick prepare-task "Add seller onboarding approval"
agentkick focus --task TASK-123
agentkick workflow-state TASK-123
agentkick summarize --handoff --to reviewer
agentkick continue TASK-123 --as reviewer
```

## Example: SaaS Repo

Pipeline:

```text
Feature Pipeline
  planner: split billing seat limit into API, backend, UI, tests
  implementer: backend enforcement
  implementer: frontend settings UI
  test writer: billing workflow tests
  reviewer: contract and memory review
```

Memory:

- billing feature file
- API contracts
- task history
- decision if pricing tradeoff exists

## Example: Chrome Extension

Pipeline:

```text
Bug Fix Pipeline
  planner: scope popup surface
  implementer: fix popup behavior
  reviewer: manifest and viewport review
  docs updater: update feature memory
```

Memory:

- chrome extension popup feature file
- workflow rule for popup viewport verification

## Example: Marketplace App

Pipeline:

```text
Feature Pipeline
  child: seller onboarding UI
  child: upload contract
  child: admin approval workflow
  child: notification state
```

Context:

- seller feature package
- API contracts
- design system
- workflow rules

## Example: Monorepo

Pipeline:

```text
Refactor Pipeline
  zone: packages/context
  zone: packages/orchestrator
  zone: docs
```

Rule:

- each package child task verifies independently
- parent workflow runs workspace build

## Example: AI Automation Platform

Pipeline:

```text
Feature Pipeline
  define workflow state contract
  implement orchestrator state transition
  update run timeline UI
  verify retry and cancel behavior
  compress execution memory
```

## Pipeline Quality Rules

A healthy pipeline:

- has a clear task type
- loads bounded context
- has stage outputs
- verifies before memory persistence
- records handoff state
- closes with compressed history

An unhealthy pipeline:

- loads whole repo
- skips task state
- mixes planning and execution without checkpoints
- relies on chat memory
- leaves no durable summary

## Product Standard

Pipelines should make agent work feel like infrastructure, not improvisation.

The agent may be probabilistic. The workflow should not be.
