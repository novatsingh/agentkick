# Agent Interaction Rules

This specification defines how coding agents should interact with AgentKick memory and context.

The goal is execution continuity: any supported agent should be able to start, pause, resume, review, and complete work using structured repo memory instead of fragile chat history.

## Supported Agents

AgentKick should provide compatible behavior for:

- Codex
- Claude Code
- Cursor
- Windsurf
- GitHub Copilot
- future autonomous coding agents

Agent-specific files may differ, but the memory contract should remain consistent.

## Universal Agent Contract

Every agent should follow this sequence:

1. Read `AGENTS.md`.
2. Read `WORKFLOW_RULES.md`.
3. Read `CURRENT_TASK.md` if present.
4. Load task-relevant memory.
5. Inspect relevant code before editing.
6. Make scoped changes.
7. Verify with documented commands.
8. Update or propose memory changes.
9. Report result, verification, and unresolved risks.

## Read Before Edit

Agents must not edit before they understand:

- task goal
- scope
- forbidden actions
- verification command
- relevant architecture or feature memory
- existing user changes when visible

For simple tasks, this can be a quick read. For broad tasks, the agent must build a plan.

## Memory Reading Rules

### Always Read

- `AGENTS.md`
- `WORKFLOW_RULES.md`
- `CURRENT_TASK.md` when present

### Read When Relevant

- `ARCHITECTURE.md` for boundaries, refactors, integrations, and broad changes
- `DESIGN_SYSTEM.md` for UI work
- `FEATURE_SUMMARIES.md` for behavior changes
- `API_CONTRACTS.md` for APIs, schemas, events, and integrations
- `DECISIONS.md` for architecture choices and disputed behavior
- `TASK_HISTORY.md` for regressions or resumed work

### Avoid By Default

- archived task logs
- full terminal output
- generated files
- dependency directories
- build outputs
- superseded decisions
- stale memory unless investigating history

## Memory Update Rules

Agents may update memory when:

- behavior changed
- architecture changed
- API contracts changed
- UI system rules changed
- workflow commands changed
- a durable decision was made
- a task completed and needs a compressed history entry

Agents should not update long-term memory for:

- unverified assumptions
- temporary exploration
- failed attempts after root cause is known
- raw command logs
- user preferences unrelated to the repo
- facts copied from external docs without project relevance

## Memory Proposal Rules

For sensitive areas, agents should propose memory updates rather than applying them silently.

Sensitive areas:

- security policy
- deployment process
- billing or auth behavior
- API breaking changes
- architecture decisions
- team workflow rules

Proposal format:

```markdown
## Proposed Memory Update

- File:
- Reason:
- Change:
- Verification:
- Risk:
```

## Current Task Rules

`CURRENT_TASK.md` is the active handoff file.

Agents should update it when:

- task scope changes
- plan changes
- a blocker appears
- verification status changes
- the thread needs reset
- handing off to another agent

Agents should clear or mark complete when:

- task is done
- user cancels the task
- task is split into separate task files

Agents should not leave old current task state active.

## Thread Reset Rules

Before ending or resetting a long thread, the agent should produce a handoff:

- current goal
- work completed
- files changed
- open blockers
- next step
- verification status
- memory files updated or still needed

This handoff belongs in `CURRENT_TASK.md` or the task file, not only in chat.

After reset, the next agent should read memory and continue without asking the user to repeat the old thread.

## Context Inheritance Rules

When splitting work:

- parent constraints apply to child tasks
- each child task gets only relevant memory
- child outcomes roll up to parent task history
- durable changes update long-term memory once, not repeatedly

Agents should avoid duplicating the same context across multiple child tasks.

## Conflict Rules

If memory conflicts with code:

1. Treat code and tests as current behavior.
2. Treat memory as possibly stale.
3. Verify before changing either.
4. Update memory when the real source of truth is known.

If memory files conflict with each other:

1. Stop and identify the conflict.
2. Prefer the file designated as source of truth.
3. If no source is clear, ask for direction or mark stale.

If user instructions conflict with memory:

1. Follow the newest explicit user instruction for the current task.
2. Update memory only if the instruction is durable project policy.

## Token Discipline Rules

Agents should:

- quote memory sparingly
- summarize long files before acting on them
- load feature-scoped memory instead of all features
- avoid copying large code blocks into memory
- prefer file references and concise bullets
- compress command output after diagnosis
- keep final reports concise

Agents should not:

- read the whole repo by default
- paste large logs into memory
- add duplicate memory entries
- use old task history as active truth

## Verification Rules

Every agent task should record verification status:

- command run
- result
- blocker if not run
- manual check if applicable

Memory should store concise verification:

```markdown
- Verification: `npm.cmd test` passed.
```

Not:

```markdown
- Verification: pasted 300 lines of terminal output.
```

## Agent-Specific Rendering

AgentKick should render the same memory contract into native surfaces.

### Codex

- Reads `AGENTS.md`.
- Uses `.codex/agents/*` for specialist behavior.
- Should receive task handoff from `CURRENT_TASK.md`.

### Claude Code

- Reads `CLAUDE.md`.
- Uses `.claude/commands/*`.
- Uses `.claude/skills/*`.
- Uses `.claude/agents/*`.

### Cursor

- Reads `.cursor/rules/*`.
- Should receive concise always-apply rules and file-specific rules.

### Copilot

- Reads `.github/copilot-instructions.md`.
- Uses `.github/instructions/*` for scoped guidance.

### Windsurf And Future Agents

- Use `.agents/skills/*`.
- Use canonical memory files.
- Use task manifests.

## Automation Rules

AgentKick automation should:

- scaffold memory files
- validate structure
- detect stale references
- compact history
- preview context bundles
- render agent-specific files
- preserve user edits

AgentKick automation should not:

- silently delete durable memory
- overwrite human edits without backup or plan
- treat generated summaries as truth without review
- require cloud sync for local memory

## Human-In-The-Loop Rules

Humans remain responsible for:

- approving major decisions
- accepting memory proposals
- resolving conflicting memory
- authorizing destructive actions
- deciding whether stale memory should be deleted or archived

Agents can maintain memory. They should not become the unreviewed authority for project truth.

## Completion Report Rules

At the end of work, agents should report:

- what changed
- memory files created or updated
- verification run
- skipped verification and reason
- open follow-up only when actionable

For documentation-only work, verification may be syntax, link, or consistency checks rather than build tests.

## Operating Standard

An AgentKick-compatible agent should leave the repo more understandable than it found it.

Every task should improve at least one of:

- code
- tests
- workflow
- memory
- context clarity
- project continuity
