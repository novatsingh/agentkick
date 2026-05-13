# Project Principles

AgentKick exists to make AI-assisted software development structured, durable, and repeatable.

It is the operating layer between repositories and coding agents.

## Product Principles

### 1. Workflow Over Retrieval

AgentKick is not a search system. It should not compete on embeddings, vector stores, code indexing, or semantic retrieval.

AgentKick competes on:

- better repo operating standards
- persistent project memory
- task isolation
- repeatable agent workflows
- context discipline
- safer execution
- cross-agent compatibility

### 2. Local-First By Default

The core product must work from a local repo with no account, no cloud service, and no network dependency.

Local-first means:

- generated files are readable markdown or JSON
- configuration is committed with the repo
- memory is version-controlled
- doctor checks run locally
- packs can be installed and audited
- users can understand every file AgentKick writes

SaaS can improve collaboration. It must not be required for the repo operating system to function.

### 3. Durable Memory Beats Long Threads

Long AI conversations degrade. Repeated explanations waste tokens and create drift.

AgentKick should move durable knowledge out of chat threads and into curated repo memory:

- what the project is
- how it is built
- how it is tested
- what decisions have been made
- what workflows should be followed
- what agents must avoid

The repo should become easier for agents to operate over time.

### 4. Context Is A Budget

More context is not always better. Unbounded context causes confusion, slower runs, and higher cost.

AgentKick should optimize context for signal:

- short permanent instructions
- scoped task context
- stack-specific rules only when needed
- compact memory summaries
- explicit exclusions for generated/vendor/build files

Every context surface should earn its tokens.

### 5. Tasks Need Boundaries

Agents perform better when the unit of work is explicit.

Each task should define:

- goal
- scope
- files or modules likely involved
- constraints
- verification command
- expected output
- review standard
- memory update requirement

No agent should need to infer the whole operating model from a vague prompt.

### 6. Agent Interoperability Is A Core Feature

Teams use more than one AI coding tool. AgentKick should support them without making one tool the center of the architecture.

AgentKick should maintain one durable project model and render it into agent-native files for:

- Codex
- Claude Code
- Cursor
- Windsurf
- GitHub Copilot
- future autonomous agents

Agent-specific files are outputs, not the source of truth.

### 7. Human Review Remains Central

AgentKick should help agents move faster without pretending review is obsolete.

The product should preserve:

- clear diffs
- small changes
- explicit verification
- visible risk notes
- approval for destructive actions
- explainable memory updates

Autonomy should increase only when workflow quality increases.

### 8. Safety Is Part Of Developer Experience

Safety should not feel like bureaucracy. It should be built into defaults:

- backups before overwrites
- dry-run support
- repo-scoped filesystem assumptions
- secrets warnings
- MCP/tool permission checks
- destructive action approval
- CI and test visibility

The safest path should also be the easiest path.

### 9. Generated Files Must Be Boring

AgentKick output should be easy to inspect, edit, and commit.

Prefer:

- markdown
- JSON
- plain directories
- explicit names
- stable schemas

Avoid:

- opaque databases for core state
- hidden global state as the only source of truth
- generated files that users cannot safely edit
- excessive magic

### 10. Opinionated, Not Rigid

AgentKick should provide strong defaults while allowing teams to adapt.

The platform should standardize:

- memory layout
- task lifecycle
- doctor checks
- agent instruction shape
- pack interfaces
- safety policies

It should not force every repo into the same framework, deployment target, or team process.

## Engineering Principles

### Modularity

The CLI should remain thin. Core logic should live in testable packages with clear boundaries.

Major domains:

- config
- profile detection
- file planning
- memory
- context
- workflows
- doctor checks
- plugins
- agent rendering
- templates

### Deterministic Writes

Given the same repo, config, and AgentKick version, generated output should be predictable.

Every write should be:

- planned before execution
- dry-runnable
- backed up when overwriting user-editable files
- easy to diff

### Progressive Complexity

AgentKick should be useful in 30 seconds and powerful after adoption.

Adoption path:

1. `agentkick init`
2. `agentkick doctor`
3. add stack packs
4. define project memory
5. use task workflows
6. adopt team policies or SaaS sync if needed

### No Hidden Lock-In

A repo prepared by AgentKick should remain usable if AgentKick is removed.

The generated files must continue to help agents and humans because they are plain repo assets.

### Versioned Contracts

Config, memory schemas, plugins, and generated file conventions should be versioned.

AgentKick should support migrations instead of silently changing meaning across releases.

## AI Workflow Philosophy

AgentKick assumes coding agents are powerful but context-sensitive systems. They need clear operating boundaries, durable project facts, and scoped workflows.

The ideal AgentKick workflow:

1. The repo explains itself.
2. The task is classified.
3. The context bundle is small and relevant.
4. The agent executes within constraints.
5. Verification is explicit.
6. The result is summarized.
7. Durable learning is written back to memory.

This is the shift from prompt improvisation to AI-native software operations.
