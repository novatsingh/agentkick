# File Conventions

This specification defines the AgentKick memory file conventions.

The conventions are optimized for coding agents, humans reviewing diffs, and future automation. Files should be markdown-first, concise, predictable, and easy to update.

## File Placement

AgentKick supports two placement models.

### Compatibility Root Files

```text
AGENTS.md
CURRENT_TASK.md
ARCHITECTURE.md
DESIGN_SYSTEM.md
FEATURE_SUMMARIES.md
TASK_HISTORY.md
API_CONTRACTS.md
DECISIONS.md
WORKFLOW_RULES.md
```

Use root files when broad agent compatibility matters. Many agents naturally discover root-level markdown files.

### Managed Memory Directory

```text
.agentkick/
  memory/
    agents.md
    current-task.md
    architecture.md
    design-system.md
    feature-summaries.md
    task-history.md
    api-contracts.md
    decisions.md
    workflow-rules.md
    features/
    decisions/
    tasks/
```

Use managed files when a team wants a cleaner root and stronger AgentKick automation.

The project config must identify the source of truth.

## Naming Rules

- Root compatibility files use uppercase snake case.
- Managed memory files use lowercase kebab case.
- Feature files use stable slugs: `billing.md`, `chrome-extension-popup.md`.
- Task files use date plus slug: `2026-05-13-fix-popup-scroll.md`.
- Decision files use numeric prefix plus slug: `0007-use-local-first-memory.md`.

Do not include random ids in human-facing filenames unless collisions are likely.

## Markdown Style

Memory markdown should be AI-friendly:

- one H1 per file
- stable H2 sections
- short bullets
- explicit status fields
- file paths in backticks
- no decorative prose
- no long copied logs
- no hidden meaning in tables when bullets are clearer

Preferred pattern:

```markdown
# File Title

## Purpose

- Why this file exists.

## Current Facts

- Fact:
- Owner:
- Updated:

## Rules

- Rule:
```

## Metadata Header

Large or managed memory files may include a small metadata block.

```markdown
---
agentkick: memory
schema: memory-file/v1
source_of_truth: true
updated: 2026-05-13
priority: P1
---
```

Root files do not require frontmatter, but AgentKick should preserve it if present.

## Status Values

Use consistent status values:

```text
active
draft
blocked
deprecated
superseded
stale
archived
```

Avoid custom one-off status terms.

## Reading Priority Values

```text
P0 always-load
P1 task-relevant
P2 continuity
P3 specialized
P4 manual-reference
P5 excluded
```

Each managed memory file should declare or inherit a priority.

## Canonical File Specifications

### `AGENTS.md`

Required sections:

```markdown
# AGENTS.md

## Project

## Purpose

## Architecture

## Commands

## Memory Map

## Agent Operating Rules

## Forbidden By Default

## Review Expectations
```

Rules:

- Keep under 200 lines.
- Do not store task history.
- Do not duplicate full architecture details.
- Link to other memory files.

### `CURRENT_TASK.md`

Required sections:

```markdown
# Current Task

## Status

## Goal

## Scope

## Non-Goals

## Relevant Files

## Plan

## Progress

## Blockers

## Verification

## Handoff Summary
```

Rules:

- One active task unless a task orchestration file declares multiple tasks.
- Must be cleared, archived, or marked completed when done.
- Should be safe as a thread-reset handoff.

### `ARCHITECTURE.md`

Required sections:

```markdown
# Architecture

## System Overview

## Runtime Boundaries

## Main Modules

## Data Flow

## External Services

## Constraints

## Open Architecture Questions
```

Rules:

- Document current architecture.
- Put rationale in `DECISIONS.md`.
- Use diagrams only when they improve speed of understanding.

### `DESIGN_SYSTEM.md`

Required sections:

```markdown
# Design System

## Product Feel

## Layout Rules

## Components

## Typography

## Color

## Interaction Patterns

## Accessibility

## Responsive Rules
```

Rules:

- Keep it implementation-aware.
- Reference component files.
- Avoid subjective design essays.

### `FEATURE_SUMMARIES.md`

Required sections:

```markdown
# Feature Summaries

## Feature Index

## Active Features

## Deprecated Features

## Feature File Map
```

Feature entry format:

```markdown
### Feature Name

- Status:
- User goal:
- Primary files:
- Behavior:
- Edge cases:
- Tests:
- Related contracts:
- Updated:
```

Rules:

- Keep top-level entries short.
- Move large features into `.agentkick/memory/features/*.md`.

### `TASK_HISTORY.md`

Required sections:

```markdown
# Task History

## Recent Tasks

## Compacted History

## Archived Task Files
```

Entry format:

```markdown
### 2026-05-13 - TASK-123 - Short Title

- Result:
- Files:
- Verification:
- Memory updates:
- Follow-up:
```

Rules:

- Append only during active work.
- Compact periodically.
- Do not store raw transcripts.

### `API_CONTRACTS.md`

Required sections:

```markdown
# API Contracts

## Contract Index

## HTTP APIs

## Events

## Data Schemas

## External Integrations

## Deprecated Contracts
```

Contract entry format:

```markdown
### Contract Name

- Status:
- Owner:
- Request:
- Response:
- Auth:
- Errors:
- Compatibility:
- Tests:
- Updated:
```

Rules:

- Update before shipping breaking changes.
- Mark deprecations clearly.
- Include error behavior, not only happy path.

### `DECISIONS.md`

Required sections:

```markdown
# Decisions

## Active Decisions

## Superseded Decisions

## Decision Template
```

Decision entry format:

```markdown
### D-0001 - Decision Title

- Date:
- Status:
- Context:
- Decision:
- Alternatives:
- Consequences:
- Review date:
```

Rules:

- Add decisions for durable tradeoffs.
- Mark superseded decisions instead of deleting them.
- Keep one decision focused on one topic.

### `WORKFLOW_RULES.md`

Required sections:

```markdown
# Workflow Rules

## Task Start

## Before Editing

## During Editing

## Verification

## Review

## Memory Updates

## Release

## Escalation
```

Rules:

- Commands must be current.
- Prefer exact commands over general advice.
- Include memory update requirements.

## Feature-Scoped File Convention

Feature file template:

```markdown
# Feature: Billing

## Status

## User Goal

## Behavior

## Primary Files

## State Model

## API Contracts

## Edge Cases

## Tests

## Recent Changes

## Known Risks
```

Use feature files when:

- a feature has more than 10 bullets in `FEATURE_SUMMARIES.md`
- multiple tasks touch the same feature
- behavior is easy to regress
- UI and API behavior need one shared memory surface

## Task File Convention

Task file template:

```markdown
# Task: Short Title

- Id:
- Status:
- Type:
- Owner:
- Created:
- Updated:

## Goal

## Scope

## Constraints

## Context

## Plan

## Execution Notes

## Verification

## Outcome

## Memory Updates
```

Task files are working memory. Completed task facts should be compressed into `TASK_HISTORY.md` and any durable memory files.

## Decision File Convention

For larger teams, each decision may be split into its own file:

```text
.agentkick/memory/decisions/
  0001-local-first-memory.md
  0002-plugin-permission-model.md
```

`DECISIONS.md` then becomes the index.

## Line Count Budgets

Recommended soft limits:

```text
AGENTS.md: 200 lines
CURRENT_TASK.md: 150 lines
ARCHITECTURE.md: 250 lines
DESIGN_SYSTEM.md: 250 lines
FEATURE_SUMMARIES.md: 300 lines before splitting features
TASK_HISTORY.md: 300 lines before compaction
API_CONTRACTS.md: 300 lines before splitting contracts
DECISIONS.md: 300 lines before splitting decisions
WORKFLOW_RULES.md: 200 lines
```

Doctor should warn before files become too large for efficient agent loading.

## Update Ownership

Memory files are shared project assets.

Allowed updates:

- agents may propose memory updates after verified work
- humans may edit memory directly
- AgentKick may scaffold and migrate structure
- plugins may contribute sections only within declared ownership

Protected behavior:

- agents should not delete durable memory without explicit instruction
- stale entries should be marked before removal
- generated sections should be clearly marked when automation owns them

## Source Of Truth Rules

- `AGENTS.md` is the operating entry point.
- `CURRENT_TASK.md` is the active task entry point.
- `ARCHITECTURE.md` is current system truth.
- `DECISIONS.md` is rationale truth.
- `API_CONTRACTS.md` is interface truth.
- `FEATURE_SUMMARIES.md` is behavior truth.
- `WORKFLOW_RULES.md` is execution truth.
- `TASK_HISTORY.md` is compressed continuity truth.

When files conflict, agents must stop and call out the conflict instead of guessing.
