# Memory System

AgentKick memory is Git for AI project memory.

It externalizes project intelligence into structured, reviewable files so coding agents can continue work without depending on fragile chat history. The memory system is local-first, markdown-native, version-controlled, and optimized for token-efficient agent consumption.

AgentKick memory is not a vector index, embedding store, semantic retrieval system, transcript archive, or search product.

## Core Idea

Software repos already use Git to preserve code history. AgentKick extends that discipline to AI-operational knowledge:

- what the project is
- how the system is shaped
- what decisions were made
- what features exist
- what contracts must not break
- what the current task is
- what past agents changed
- what rules future agents must follow

The memory system should make a fresh agent useful in minutes instead of requiring a long explanation from the user.

## Memory Principles

### Durable Over Conversational

Any fact that future agents will need again should leave the chat and enter memory.

Examples:

- approved architecture direction
- API contract decisions
- fragile build or deploy steps
- feature behavior summaries
- known constraints
- current task state

### Structured Over Exhaustive

Memory should not store everything. It should store the minimum durable information required to preserve continuity.

Bad memory:

- full terminal logs
- full chat transcripts
- broad speculation
- stale brainstorming
- copied documentation from external products

Good memory:

- concise decisions
- current architecture boundaries
- verified commands
- task outcomes
- feature behavior summaries
- known risks with owners

### Reviewable Over Magical

Memory lives in plain files. Developers can diff, edit, review, and revert it.

The memory system should behave like code:

- versioned
- branch-aware
- human-readable
- easy to review in pull requests
- safe to update incrementally

### Current State Over Historical Noise

Memory files should favor present truth. Historical details belong in task history or decision records only when they help future work.

## Canonical Memory File Set

AgentKick should support a canonical root-level memory surface for broad agent compatibility:

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

For repos that prefer a contained layout, AgentKick may mirror or source these from:

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
```

The compatibility strategy should be explicit:

- Root files are agent-visible entry points.
- `.agentkick/memory/*` can be the canonical source for structured management.
- AgentKick must avoid creating two divergent truths.
- If both locations exist, config must declare which location is authoritative.

## File Contracts

### `AGENTS.md`

Purpose:

- Primary operating manual for coding agents.
- Defines repo identity, commands, safety rules, and expected workflow.
- Always read before work begins.

Content:

- project purpose
- stack and package manager
- required commands
- forbidden actions
- review expectations
- memory file map
- context loading rules

Update strategy:

- Update when repo operating rules change.
- Keep stable and short.
- Avoid task-specific details.

Reading priority: P0 always-load.

### `CURRENT_TASK.md`

Purpose:

- Active task state for interrupted or long-running work.
- Keeps agents aligned after thread resets.

Content:

- task id
- status
- goal
- scope
- non-goals
- files touched or likely relevant
- plan
- blockers
- verification required
- latest handoff summary

Update strategy:

- Create when a task starts.
- Update at meaningful state changes.
- Clear or archive when task closes.

Reading priority: P0 when present.

### `ARCHITECTURE.md`

Purpose:

- Current system shape.
- Explains boundaries, entry points, data flow, ownership areas, and integration points.

Content:

- high-level architecture
- major modules
- runtime boundaries
- persistence boundaries
- external services
- known constraints
- diagrams when useful

Update strategy:

- Update after architecture-affecting changes.
- Prefer current truth over historic explanation.
- Link to `DECISIONS.md` for rationale.

Reading priority: P1 for most code tasks, P0 for architecture/refactor tasks.

### `DESIGN_SYSTEM.md`

Purpose:

- Product and UI memory.
- Preserves visual rules, component patterns, interaction principles, and accessibility standards.

Content:

- design principles
- layout patterns
- typography
- color and spacing rules
- component usage
- responsive behavior
- accessibility requirements

Update strategy:

- Update after UI system changes.
- Keep examples short.
- Avoid screenshots unless they are stable and referenced by path.

Reading priority: P1 for frontend tasks, P3 otherwise.

### `FEATURE_SUMMARIES.md`

Purpose:

- Concise map of implemented product behavior.
- Helps agents avoid rediscovering features from code.

Content:

- feature name
- user goal
- primary files
- behavior summary
- states and edge cases
- dependencies
- test coverage
- known limitations

Update strategy:

- Update after feature work completes.
- Keep each feature summary under a strict size limit.
- Archive removed features promptly.

Reading priority: P1 for feature work, P2 for bug fixes.

### `TASK_HISTORY.md`

Purpose:

- Chronological compressed history of completed tasks.
- Enables continuity without preserving full chat logs.

Content:

- date
- task id
- summary
- files changed
- verification run
- outcome
- follow-up notes

Update strategy:

- Append on task completion.
- Periodically compact older entries into feature or architecture memory.
- Do not store raw logs.

Reading priority: P2 when investigating regressions or continuity.

### `API_CONTRACTS.md`

Purpose:

- Memory for APIs, schemas, events, permissions, integration contracts, and external boundaries.

Content:

- endpoint or contract name
- request shape
- response shape
- auth requirements
- error behavior
- versioning notes
- compatibility constraints

Update strategy:

- Update before or with contract changes.
- Mark deprecated contracts clearly.
- Preserve migration notes until the migration window closes.

Reading priority: P1 for backend, integration, and client/server tasks.

### `DECISIONS.md`

Purpose:

- Lightweight architecture decision record.
- Captures durable rationale without forcing heavy ADR ceremony.

Content:

- decision id
- date
- status
- context
- decision
- alternatives considered
- consequences
- review date if temporary

Update strategy:

- Add entries for meaningful tradeoffs.
- Mark superseded decisions instead of deleting them.
- Compact low-value historic decisions only after they are no longer actionable.

Reading priority: P1 for architecture and disputed behavior, P2 for most implementation tasks.

### `WORKFLOW_RULES.md`

Purpose:

- Repeatable project workflows for agents and humans.
- Defines how to test, build, release, deploy, debug, review, and update memory.

Content:

- task start workflow
- edit workflow
- verification workflow
- review workflow
- release workflow
- memory update workflow
- escalation rules

Update strategy:

- Update when commands, CI, deployment, or review process changes.
- Keep commands executable and current.

Reading priority: P0 for task execution.

## Reading Priority Model

AgentKick should classify memory files by priority:

```text
P0 always read
P1 read for most relevant tasks
P2 read when task history or continuity is needed
P3 read only for specialized tasks
P4 never auto-load, reference manually
```

Default priorities:

```text
P0 AGENTS.md
P0 WORKFLOW_RULES.md
P0 CURRENT_TASK.md when present
P1 ARCHITECTURE.md
P1 API_CONTRACTS.md for API tasks
P1 DESIGN_SYSTEM.md for UI tasks
P1 FEATURE_SUMMARIES.md for feature tasks
P1 DECISIONS.md for architecture tasks
P2 TASK_HISTORY.md
```

The goal is to load the correct memory, not all memory.

## Memory Update Strategy

Memory updates should happen at task boundaries.

### Task Start

- Create or refresh `CURRENT_TASK.md`.
- Record goal, scope, constraints, and verification target.
- Do not update long-term memory yet unless the user explicitly provides durable facts.

### During Execution

- Keep `CURRENT_TASK.md` current.
- Record blockers and decisions that affect the task.
- Avoid updating permanent memory for unverified assumptions.

### Task Completion

- Append compressed result to `TASK_HISTORY.md`.
- Update feature, architecture, design, API, or workflow files only if durable truth changed.
- Add a decision entry if a meaningful tradeoff was made.
- Clear or archive `CURRENT_TASK.md`.

### Review

- Memory updates should be visible in the same diff as the code change when they explain the change.
- Reviewers should be able to reject memory updates independently from code when they are inaccurate.

## Memory Compression

Compression turns noisy work into durable signal.

Compression rules:

- Preserve outcome, not conversation.
- Preserve verified commands, not full logs.
- Preserve rationale, not all debate.
- Preserve current behavior, not every intermediate attempt.
- Preserve links to files, not copied code blocks.

Recommended task summary format:

```markdown
## 2026-05-13 - TASK-123 - Fix trial email conflict handling

- Result: Popup now shows account/device conflict clearly instead of generic server error.
- Files: `src/popup.js`, `server/trial.js`
- Verification: `node --check src/popup.js`; manual popup check in Chrome.
- Memory updates: `FEATURE_SUMMARIES.md`, `API_CONTRACTS.md`
- Follow-up: Add automated integration test for conflict response.
```

## Stale Memory Cleanup

Stale memory is dangerous because agents tend to trust written context.

AgentKick should detect:

- files referenced in memory that no longer exist
- commands that fail or no longer appear in package scripts
- features marked active but removed from code
- decisions that have passed a review date
- duplicate or conflicting facts
- current task files older than a configured threshold

Cleanup actions:

- mark stale entries with `Status: stale`
- move old task history into archive summaries
- replace obsolete feature notes with current behavior
- mark superseded decisions instead of deleting them
- require human review before deleting long-term memory

## Thread Reset Strategy

AgentKick should make thread resets normal.

When an AI conversation becomes large or degraded:

1. Summarize current task into `CURRENT_TASK.md`.
2. Save durable outcomes into the appropriate memory files.
3. Record open blockers and verification status.
4. Start the next thread by reading P0 files and task-relevant P1 files.

The new agent should not need the old conversation. It should need the repo memory.

## Memory Synchronization

Memory sync means keeping agent-facing memory aligned with code, config, and team decisions.

Local sync:

- update memory in the same branch as code
- review memory diffs in pull requests
- run doctor to detect missing or stale memory
- keep root agent files and `.agentkick/memory` authoritative source aligned

Future SaaS sync:

- sync structured memory metadata
- propose memory updates for review
- flag repo drift across teams
- preserve local files as the source of operational truth

No sync strategy should make the repo unusable offline.

## Long-Term Philosophy

The memory system should make a repository progressively more agent-native.

Every completed task should leave the repo slightly easier for the next agent to understand. Not by storing more text, but by refining the durable project model.

AgentKick memory succeeds when:

- fewer prompts repeat project basics
- agents read less but understand more
- task handoffs survive thread resets
- decisions remain visible
- stale knowledge is identified quickly
- memory diffs are as reviewable as code diffs
