# Execution Scoping

Execution Scoping defines the boundaries of an AI task before work begins.

It answers:

```text
Where may the agent operate?
What must it read?
What must it avoid?
How will the work be verified?
What memory must be updated?
```

## Scope Types

### File Scope

Specific files or globs included in execution.

```yaml
include:
  - src/features/billing/**
  - tests/billing/**
exclude:
  - dist/**
  - node_modules/**
```

### Feature Scope

Feature memory plus primary files.

```yaml
feature: billing
memory:
  - .agentkick/memory/features/billing.md
  - API_CONTRACTS.md#billing
```

### Contract Scope

Interface or schema boundary.

```yaml
contract:
  - API_CONTRACTS.md#checkout-session
files:
  - src/api/checkout/**
  - src/client/checkout.ts
```

### Workflow Scope

Allowed phases and commands.

```yaml
allowed_phases:
  - inspect
  - edit
  - verify
allowed_commands:
  - npm.cmd test -- checkout
  - npm.cmd run build
```

### Memory Scope

Memory files to load and update.

```yaml
load:
  - AGENTS.md
  - WORKFLOW_RULES.md
  - FEATURE_SUMMARIES.md
update_on_completion:
  - TASK_HISTORY.md
  - FEATURE_SUMMARIES.md
```

## Scope Manifest

Each task should have a scope manifest:

```yaml
id: TASK-123
title: Fix checkout coupon validation
type: bugfix
zone: frontend.checkout
include:
  - src/features/checkout/**
  - tests/checkout/**
exclude:
  - dist/**
  - coverage/**
memory:
  required:
    - AGENTS.md
    - WORKFLOW_RULES.md
    - .agentkick/memory/features/checkout.md
  conditional:
    - API_CONTRACTS.md#coupon
verification:
  narrow:
    - npm.cmd test -- checkout
  broad:
    - npm.cmd run build
```

## Focused File Selection

File selection should follow deterministic tiers:

```text
Tier 0 explicitly named files
Tier 1 files in task execution zone
Tier 2 tests for tier 0 and tier 1 files
Tier 3 contracts and feature memory
Tier 4 architecture docs for boundary changes
Tier 5 recent task history only when continuity is needed
```

The engine should prefer explicit scope over broad discovery.

## Dependency-Aware Scope

When a task touches a dependency, scope should include:

- direct file
- nearest tests
- contract memory
- feature memory
- public API surface if exported
- shared utility owner notes if documented

Scope should not automatically expand to every transitive dependency unless the task requires it.

## Scope Expansion

Agents may request scope expansion when:

- root cause is outside current files
- tests reveal related behavior
- contract mismatch is found
- memory conflicts with code
- verification cannot be completed inside current scope

Expansion request format:

```markdown
## Scope Expansion Request

- Current scope:
- Needed addition:
- Reason:
- Risk:
- Verification impact:
```

The engine records expansion in workflow state.

## Scope Violations

Scope violation examples:

- editing files outside include list without expansion
- running destructive commands outside allowed commands
- changing API contract during UI-only task
- updating global workflow rules for a local bug
- modifying generated/vendor files

Doctor should flag repeated scope violations as execution isolation risk.

## AI-Safe Boundaries

An AI-safe boundary has:

- named owner zone
- included paths
- excluded paths
- required memory
- verification command
- non-goals
- escalation rule

Without these, the task remains fragile.

## CLI: `agentkick focus`

```bash
agentkick focus --feature checkout
agentkick focus --task TASK-123
agentkick focus --zone extension.popup
agentkick focus --files src/popup.js popup.html
```

Example:

```text
AgentKick Focus

Scope
  zone: extension.popup
  task: TASK-123

Read
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick/memory/features/chrome-extension-popup.md
  API_CONTRACTS.md#trial
  popup.html
  src/popup.js
  src/popup.css

Avoid
  background/**
  content-scripts/**
  dist/**

Verify
  npm.cmd test
  manual popup viewport check
```

## Workflow Examples

### SaaS Repo

Scope by feature and layer:

```text
feature: billing
layers: API, database, settings UI
contracts: billing subscription API
memory: billing feature file, API_CONTRACTS.md
verification: billing tests, build
```

### Chrome Extension

Scope by extension surface:

```text
zone: extension.popup
include: popup UI, popup scripts, popup styles
exclude: background service worker unless messaging changes
verification: syntax, constrained viewport, manifest permissions
```

### Marketplace App

Scope by actor workflow:

```text
zone: seller.onboarding
include: seller forms, upload API, admin status hooks
exclude: buyer checkout, payment settlement
memory: seller onboarding feature package
```

### Monorepo

Scope by package:

```text
zone: packages/context
include: packages/context/**, tests/context/**
exclude: apps/web unless UI docs change
verification: package test, workspace build
```

### AI Automation Platform

Scope by workflow state:

```text
zone: orchestrator.retry
include: workflow state machine, run timeline, retry contract
memory: workflow state docs, API contracts
verification: state transition tests
```

## Product Standard

Execution scope should be small enough for an agent to understand and large enough to verify safely.

If scope cannot be stated clearly, the task is not ready to execute.
