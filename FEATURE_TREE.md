# Feature Tree

This document defines the product surface for AgentKick as an AI workflow operating system.

The tree is intentionally organized by user capability, not by implementation files.

## 1. Repo Initialization

### 1.1 New Project Creation

- Create AI-agent-ready starter projects.
- Support stack templates.
- Generate project files and agent operating files together.
- Provide next-step commands.
- Validate generated output with doctor.

Templates:

- Chrome extension
- Next.js
- Landing page
- Node CLI
- FastAPI
- Flask
- Laravel
- Go CLI
- Rust CLI
- Electron

### 1.2 Existing Repo Upgrade

- Detect stack and tooling.
- Generate baseline agent instructions.
- Generate memory scaffold.
- Generate context policy.
- Add core workflows.
- Preserve existing user files with backups.
- Support dry-run preview.

### 1.3 Repo Profile Detection

- Project name
- Stack
- package manager
- test command
- build command
- launch target
- CI presence
- deploy platform
- agent file status
- memory status
- known risk indicators

## 2. Agent Interoperability

### 2.1 Codex Support

- `AGENTS.md`
- `.codex/agents/*`
- task handoff files
- review workflows
- verification rules

### 2.2 Claude Code Support

- `CLAUDE.md`
- `.claude/commands/*`
- `.claude/skills/*`
- `.claude/agents/*`

### 2.3 Cursor Support

- `.cursor/rules/*`
- stack-specific rules
- always-apply project rules

### 2.4 GitHub Copilot Support

- `.github/copilot-instructions.md`
- `.github/instructions/*`
- path-specific instructions

### 2.5 Windsurf And Future Agent Support

- generic `.agents/skills/*`
- task manifests
- workflow manifests
- memory contracts
- capability-based renderers

## 3. Persistent Memory

### 3.1 Memory Scaffold

- project facts
- architecture notes
- known issues
- decisions
- workflows
- task summaries

### 3.2 Memory Commands

- `agentkick memory init`
- `agentkick memory validate`
- `agentkick memory list`
- `agentkick memory compact`
- `agentkick memory add-decision`
- `agentkick memory summarize-task`

### 3.3 Memory Quality

- stale memory detection
- oversized memory warnings
- duplicate fact detection
- missing command warnings
- unresolved decision warnings
- memory schema validation

### 3.4 Memory Write-Back

- summarize completed tasks
- capture verification commands
- record architectural decisions
- update known issues
- update workflow runbooks
- preserve human-editable format

## 4. Context Optimization

### 4.1 Context Manifest

- always-load files
- task-load candidates
- conditional stack rules
- excluded files
- generated file policy
- vendor/build output policy

### 4.2 Context Budgets

- global instruction budget
- task context budget
- memory budget
- command output budget
- final report budget

### 4.3 Context Preview

- `agentkick context preview`
- show files included for task type
- show why each file is included
- show estimated token weight where available
- show exclusions

### 4.4 Context Compression

- compress task outcomes
- compress command output
- compress repeated workflow notes
- preserve decisions separately from logs

## 5. Task Orchestration

### 5.1 Task Creation

- `agentkick task new`
- task type selection
- scope definition
- constraints
- expected output
- verification command

### 5.2 Task Types

- bug fix
- feature
- refactor
- test writing
- security scan
- dependency upgrade
- deploy debugging
- release preparation
- documentation
- architecture planning

### 5.3 Task State Machine

- created
- scoped
- planned
- executing
- verifying
- reviewing
- blocked
- completed
- cancelled

### 5.4 Task Files

- task manifest
- task plan
- context bundle
- verification notes
- review notes
- completion summary
- memory update proposal

### 5.5 Agent Handoffs

- assign task to supported agent
- render agent-specific task instructions
- preserve constraints across tools
- resume interrupted tasks
- close tasks with verification status

## 6. Workflow Packs

### 6.1 Core Pack

- review
- write tests
- fix CI
- explain codebase
- baseline reviewer agent

### 6.2 Stack Packs

- Chrome extension
- Next.js
- Python API
- Laravel/PHP
- Go
- Rust
- Electron

### 6.3 Platform Packs

- Netlify
- GitHub
- Render
- Supabase
- Stripe

### 6.4 Practice Packs

- security
- performance
- accessibility
- release
- migration
- documentation

### 6.5 Pack Lifecycle

- add
- remove
- validate
- upgrade
- list installed packs
- show contributed files

## 7. Doctor And Readiness

### 7.1 Readiness Score

- required operating files
- memory completeness
- workflow coverage
- context discipline
- safety rules
- command detection
- CI presence
- plugin health

### 7.2 Strict Mode

- fail if core files are missing
- fail below readiness threshold
- warn on missing tests or build commands
- warn on unsafe MCP/tool config
- warn on oversized memory

### 7.3 JSON Output

- machine-readable audit
- CI integration
- SaaS reporting
- historical tracking

### 7.4 Suggested Fixes

- run `agentkick init`
- add stack packs
- add GitHub pack
- document test/build commands
- compact memory
- restrict tool permissions

## 8. Plugin System

### 8.1 Plugin Install

- local folder install
- registry install
- version lock
- compatibility check
- permission declaration

### 8.2 Plugin Contributions

- templates
- packs
- doctor checks
- memory schemas
- context policies
- task workflows
- generated files
- migrations

### 8.3 Plugin Safety

- declared file access
- declared commands
- no broad write access by default
- dry-run visibility
- uninstall support
- trust policy

### 8.4 Plugin Authoring

- plugin SDK
- test harness
- fixture runner
- manifest validator
- documentation generator

## 9. SaaS Compatibility

### 9.1 Team Policy

- organization defaults
- required packs
- forbidden permissions
- memory templates
- doctor thresholds

### 9.2 Shared Pack Registry

- official packs
- team packs
- private packs
- version pinning
- trust metadata

### 9.3 Fleet Visibility

- repo readiness dashboard
- stale memory dashboard
- missing CI dashboard
- unsafe MCP dashboard
- plugin drift dashboard

### 9.4 Collaboration

- memory review proposals
- task handoff history
- workflow analytics
- approval trails

SaaS must extend local-first behavior, not replace it.

## 10. Developer Experience

### 10.1 Fast Start

- `agentkick new`
- `agentkick init`
- `agentkick doctor`

### 10.2 Explainability

- show generated files
- show why checks fail
- show pack contributions
- show task context
- show memory updates

### 10.3 Reversibility

- backups
- dry runs
- plugin uninstall
- generated file markers
- config migrations

### 10.4 Product Feel

AgentKick should feel precise, fast, and calm:

- direct terminal output
- no noisy banners
- clear next actions
- high-signal docs
- predictable file layout
- no hidden complexity in common flows
