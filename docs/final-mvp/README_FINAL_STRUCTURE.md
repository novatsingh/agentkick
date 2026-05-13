# README Final Structure

This document defines the final README structure for AgentKick v1.

## Above The Fold

```markdown
# AgentKick

The missing workflow layer for AI-assisted development.

AgentKick makes your repo easier for Codex, Cursor, Claude Code, Copilot, Windsurf, and future coding agents to understand, scope, verify, and resume.
```

Immediate commands:

```bash
npx agentkick init
npx agentkick doctor
```

## Problem

Explain the pain in practical terms:

- giant AI chats lose accuracy
- agents repeatedly need repo explanations
- generated files waste context
- task handoffs disappear after reset
- every AI tool uses slightly different instructions

Avoid abstract platform language.

## What AgentKick Does

Short bullets:

- creates agent operating files
- creates repo memory
- checks AI workflow readiness
- prepares scoped agent context
- summarizes completed work
- splits broad tasks into safer chunks

## What AgentKick Is Not

Must be explicit:

- not semantic search
- not vector retrieval
- not GraphRAG
- not an AI coding agent
- not a cloud runtime
- not a SaaS requirement

## Quick Demo

Terminal transcript:

```bash
npx agentkick init
npx agentkick doctor
agentkick focus --files src/popup.js popup.html
agentkick summarize --task "Fix popup CTA"
```

Show:

- no source files changed by init
- Doctor score
- focus output
- compact task memory

## The Five Commands

### `agentkick init`

Prepares repo memory and agent rules.

### `agentkick doctor`

Finds AI workflow risks and context waste.

### `agentkick focus`

Creates a paste-ready task context brief.

### `agentkick summarize`

Records task outcome so future agents can continue.

### `agentkick split-task`

Breaks oversized AI tasks into scoped chunks.

## Generated Files

Show minimal file tree:

```text
AGENTS.md
WORKFLOW_RULES.md
.agentkick.json
.agentkick/
  memory/
    project.md
    decisions.md
    tasks.md
  context/
    manifest.json
```

Explain each in one line.

## Works With Your Agent

List:

- Codex
- Cursor
- Claude Code
- GitHub Copilot
- Windsurf
- future coding agents

Clarify:

AgentKick does not replace these tools. It gives them a better repo operating layer.

## Local-First

State:

- no account required
- no repo upload
- plain files
- Git-reviewable
- works offline

## Example Doctor Output

Include a compact realistic example:

```text
AgentKick Doctor

AI readiness: 82/100 usable

Fix now
  P1 context risk  src/App.tsx is 1,240 lines; agents must load unrelated UI state.
  P1 memory gap    no task history for completed AI work.

Next
  agentkick focus --files <paths>
```

## Installation

Use:

```bash
npx agentkick init
```

Optional global install:

```bash
npm install -g agentkick
```

## Development

Use:

```bash
npm install
npm test
```

On Windows:

```bash
npm.cmd test
```

## Roadmap

Keep short:

- stronger Doctor checks
- better focus manifests
- more stack-aware memory templates
- GitHub Action after CLI trust
- optional team reporting later

Do not lead with SaaS, plugin SDK, or marketplace.

## README Tone

Use:

- practical
- local-first
- agent-compatible
- reviewable
- fast

Avoid:

- magical
- autonomous
- AI brain
- enterprise platform
- workflow studio

## README Success Criteria

The README succeeds if a developer can answer:

- What problem does this solve?
- Will it modify my source code?
- What do I run first?
- What files does it create?
- How does it help my AI agent today?
