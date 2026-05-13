# System Architecture

AgentKick is an AI workflow operating system for software repositories. It standardizes how coding agents understand a repo, preserve durable project memory, isolate tasks, manage context, and execute repeatable workflows.

AgentKick is not a semantic search engine, vector database, embedding pipeline, retrieval framework, or code indexing competitor. It may reference existing files, summaries, and manifests, but its core value is workflow structure, memory discipline, and agent interoperability.

## Mission

Transform chaotic vibe coding into structured AI-assisted software development.

AgentKick gives every repository a durable operating layer that helps Codex, Claude Code, Cursor, Windsurf, Copilot, and future coding agents work with less repeated explanation and less context waste.

## Design Goals

- Make repository intent explicit before agents edit code.
- Keep high-signal context small enough to fit into agent windows.
- Preserve durable memory outside long chat threads.
- Separate task planning, execution, review, and verification.
- Standardize workflows across different coding agents without locking into one vendor.
- Keep all core functionality local-first and repo-portable.
- Support future hosted collaboration without making local users dependent on SaaS.

## Non-Goals

- No embeddings infrastructure.
- No vector database.
- No semantic code search product.
- No replacement for source control, CI, issue trackers, or IDEs.
- No attempt to become a coding model or autonomous agent itself.

AgentKick prepares and governs the environment where coding agents operate.

## Operating Layers

AgentKick has six core layers.

### 1. Repo Standardization Layer

The repo standardization layer writes and maintains canonical agent-facing files:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.github/instructions/*`
- `.cursor/rules/*`
- `.claude/commands/*`
- `.claude/skills/*`
- `.claude/agents/*`
- `.agents/skills/*`
- `.codex/agents/*`
- `.agentkick.json`

These files turn implicit project knowledge into stable repo contracts. They define stack facts, commands, safety rules, review expectations, workflow entry points, and agent-specific operating guidance.

### 2. Persistent Memory Layer

The memory layer stores durable, curated project knowledge in repo-readable files. It avoids chat-thread dependency and keeps repeated context out of future prompts.

Memory is not raw transcript storage. It is a structured set of facts, decisions, workflows, summaries, and constraints that agents can consume quickly.

Primary memory types:

- Project facts: stack, package manager, deploy target, test commands.
- Architecture notes: boundaries, entry points, ownership areas.
- Decisions: accepted tradeoffs, rejected alternatives, migration rationale.
- Workflow history: common commands, release steps, known failure modes.
- Task summaries: what changed, why, and how it was verified.
- Safety notes: secrets policy, permission boundaries, destructive-action rules.

Memory must be compact, auditable, and easy to edit in version control.

### 3. Context Lifecycle Layer

The context lifecycle layer decides what an agent should read before work starts, what should be kept during the task, and what should be written back after completion.

Lifecycle stages:

1. Discover: detect stack, tooling, commands, and existing agent files.
2. Scope: identify the relevant task surface and required operating rules.
3. Load: provide only the context needed for the current task.
4. Execute: guide the agent through inspect, change, verify, and report.
5. Compress: summarize outcomes into durable memory.
6. Retire: remove stale task-local context from active prompts.

The goal is not maximum context. The goal is sufficient context with minimum token load.

### 4. Task Orchestration Layer

The orchestration layer breaks work into explicit workflow states:

- intake
- classification
- planning
- context assembly
- execution
- verification
- review
- handoff
- memory update

Each state has inputs, outputs, and allowed tools. This keeps agent work bounded and reviewable.

Example task classes:

- bug fix
- feature implementation
- refactor
- security review
- dependency upgrade
- release preparation
- deployment debugging
- documentation update
- architecture planning

Each task class can map to a workflow pack with specific prompts, skills, checks, and specialist-agent guidance.

### 5. Execution Workflow Layer

The execution layer defines how AgentKick turns a workflow into concrete repo actions.

Core execution principles:

- Read before editing.
- Prefer narrow patches.
- Preserve user changes.
- Verify with the smallest useful command.
- Report blockers precisely.
- Never hide failed verification.
- Require approval for destructive actions.

Execution is agent-neutral. AgentKick does not assume one runtime. It emits files and workflows that multiple agents can interpret.

### 6. Plugin And Pack Layer

Packs add workflow capabilities for stacks, platforms, and practices. Plugins are installable bundles that can contribute templates, packs, checks, memory schemas, task workflows, and agent profiles.

Examples:

- `chrome-extension`
- `nextjs`
- `netlify`
- `security`
- `github`
- `python`
- `go`
- `rust`
- `electron`

Packs are the workflow equivalent of framework adapters. They should add domain-specific agent behavior without coupling the core CLI to every ecosystem.

## Package Architecture

AgentKick should evolve from the current single-package CLI into a modular monorepo.

Target packages:

- `@agentkick/cli`: command-line entry point.
- `@agentkick/core`: shared domain model, profile detection, file plans, safety policies.
- `@agentkick/memory`: memory schemas, compaction rules, memory writers, validation.
- `@agentkick/context`: context manifests, context budgets, task context assembly.
- `@agentkick/orchestrator`: workflow state machine and task plans.
- `@agentkick/doctor`: readiness audits and strict checks.
- `@agentkick/templates`: project template registry.
- `@agentkick/packs`: official workflow packs.
- `@agentkick/plugin-sdk`: plugin manifest, hooks, validators, compatibility contracts.
- `@agentkick/agent-interop`: renderers for Codex, Claude Code, Cursor, Windsurf, and Copilot.
- `@agentkick/config`: config loader, schema migrations, defaults.
- `@agentkick/fs`: safe file operations, backups, dry runs, path guards.

This keeps the CLI thin and makes the platform testable.

## CLI Architecture

The CLI is the local operating console for AgentKick.

Command families:

- `agentkick new`: create an AI-agent-ready project.
- `agentkick init`: upgrade an existing repo.
- `agentkick add`: install a pack.
- `agentkick doctor`: audit AI-readiness.
- `agentkick memory`: inspect, validate, compact, and update persistent memory.
- `agentkick task`: create, run, resume, and close task workflows.
- `agentkick context`: preview the context bundle for a task.
- `agentkick plugin`: install, list, validate, and remove plugins.
- `agentkick migrate`: upgrade AgentKick config and generated files.

The CLI should use a plan-first write model:

1. Detect repo profile.
2. Load config and installed packs.
3. Build an operation plan.
4. Show dry-run output when requested.
5. Apply writes through safe file operations.
6. Run validation.
7. Print next actions.

## Memory Architecture

Memory should be file-based, structured, versionable, and compact.

Recommended repo layout:

```text
.agentkick/
  config.json
  memory/
    project.md
    architecture.md
    decisions/
      0001-example.md
    workflows/
      release.md
      debugging.md
    tasks/
      2026-05-13-example.md
    known-issues.md
  context/
    manifest.json
    budgets.json
  workflows/
    bugfix.json
    feature.json
  plugins/
    lock.json
```

Memory files should answer: what should a new agent know before touching this repo?

They should not become a dumping ground for every log, transcript, or search result.

## Context Lifecycle

AgentKick should treat context as a managed resource.

Context classes:

- Always-load: short, stable operating rules such as `AGENTS.md`.
- Task-load: files relevant to the current task.
- Conditional-load: stack-specific pack guidance.
- Avoid-load: generated files, dependencies, build outputs, transcripts.
- Write-back: concise memory summaries after work completes.

Context budgets should be explicit:

- global budget for repo instructions
- task budget for active work
- memory budget for durable facts
- verification budget for command output summaries

Agents should receive context manifests instead of broad instructions to read everything.

## Task Orchestration Architecture

A task is a first-class object.

Task schema:

- id
- title
- type
- status
- owner agent
- scope
- constraints
- required context
- allowed tools
- plan
- verification commands
- review requirements
- outcome summary
- memory updates

Task states:

```text
created -> scoped -> planned -> executing -> verifying -> reviewing -> completed
                                      \-> blocked
                                      \-> cancelled
```

This creates predictable handoffs between humans and agents. It also makes long-running work resumable without requiring a giant conversation.

## Plugin Architecture

Plugins should be declarative first and executable only when necessary.

Plugin capabilities:

- templates
- packs
- doctor checks
- memory schemas
- task workflows
- generated files
- agent profiles
- context policies
- migrations

Plugin manifest fields:

- name
- version
- AgentKick engine range
- contributed commands
- contributed packs
- file write permissions
- generated file paths
- safety requirements
- validation hooks

Plugins must not receive broad filesystem authority by default. A plugin should declare exactly which files it reads and writes.

## Agent Interoperability

AgentKick should generate native instructions for each coding environment while preserving one source of truth.

Interoperability targets:

- Codex: `AGENTS.md`, `.codex/agents/*`, task handoff files.
- Claude Code: `CLAUDE.md`, `.claude/commands/*`, `.claude/skills/*`, `.claude/agents/*`.
- Cursor: `.cursor/rules/*`.
- GitHub Copilot: `.github/copilot-instructions.md`, `.github/instructions/*`.
- Windsurf: workspace rules and workflow files when supported.
- Future agents: generic `.agents/skills/*`, task manifests, memory files.

Agent-specific files are render targets. The durable source should live in AgentKick config, memory, packs, and workflow definitions.

## Future SaaS Compatibility

AgentKick should remain local-first while allowing hosted collaboration later.

The SaaS layer should add:

- team policy management
- shared workflow packs
- organization-level memory templates
- fleet-wide doctor reporting
- task analytics
- plugin distribution
- secure sync
- approval workflows

The SaaS layer should not be required for:

- creating projects
- initializing repos
- running doctor
- using memory
- using packs
- generating agent instructions

Local output must remain readable, portable, and useful without a hosted account.

## Architectural North Star

AgentKick should feel like Vercel-level workflow clarity, Linear-level operational discipline, Cursor-level AI-native ergonomics, and Raycast-level local developer speed.

It should make the correct way to use coding agents the default path.
