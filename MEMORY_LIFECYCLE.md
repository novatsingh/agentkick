# Memory Lifecycle

AgentKick memory has a lifecycle from creation to retirement.

The lifecycle prevents memory from becoming stale, bloated, or misleading. It also defines how task work becomes durable repo intelligence.

## Lifecycle States

```text
proposed -> active -> reviewed -> stale -> superseded -> archived
```

### Proposed

Memory that an agent or user suggests but has not been reviewed.

Examples:

- suggested decision entry
- generated task summary
- inferred feature summary

Rules:

- Mark clearly as proposed.
- Do not treat as source of truth until accepted.
- Prefer separate memory update sections in task files or pull requests.

### Active

Current source of truth.

Rules:

- Agents may rely on it.
- Doctor should validate it.
- Updates should be reviewed like code.

### Reviewed

Active memory that was recently verified against code or process.

Rules:

- Mark review date for high-risk areas.
- Use for API contracts, workflows, and architecture during migrations.

### Stale

Memory suspected to be outdated.

Rules:

- Mark as stale before deleting.
- Include reason.
- Assign cleanup action when possible.

### Superseded

Memory replaced by a newer decision, contract, or architecture.

Rules:

- Preserve rationale if useful.
- Link to the superseding entry.
- Do not auto-load superseded entries.

### Archived

Historical memory no longer needed for active context.

Rules:

- Keep compressed.
- Exclude from default context.
- Use only for audits or deep history.

## Task-To-Memory Flow

```text
Task starts
  -> CURRENT_TASK.md created
  -> relevant memory loaded
  -> work happens
  -> verification recorded
  -> durable facts extracted
  -> memory files updated
  -> task history appended
  -> CURRENT_TASK.md cleared or archived
```

## Task Start

At task start, AgentKick should create or refresh active working memory.

Required fields:

- task id
- task type
- goal
- scope
- non-goals
- constraints
- relevant files
- expected verification
- memory files likely affected

Rules:

- Do not write permanent memory from guesses.
- If the user provides durable facts, record them with source and date.
- Keep `CURRENT_TASK.md` focused on one task.

## Task Execution

During work:

- update progress only at meaningful checkpoints
- record blockers precisely
- capture decisions when they become durable
- keep raw logs out of memory unless they are the artifact being debugged
- summarize command output after root cause is understood

Working memory should help resume the task, not narrate every action.

## Task Completion

At completion, AgentKick should extract durable memory.

Completion checklist:

- result summarized
- files changed listed
- verification command recorded
- skipped verification explained
- feature summaries updated if behavior changed
- API contracts updated if interfaces changed
- architecture updated if boundaries changed
- design system updated if UI rules changed
- decision recorded if tradeoff matters
- task history appended
- current task cleared or archived

## Memory Compression Cycle

Compression should happen continuously for task-local context and periodically for long-term memory.

### Immediate Compression

At the end of each task:

- compress task into one history entry
- extract durable changes
- remove raw execution notes from active context

### Periodic Compression

When files exceed budget:

- compact old task history into monthly or release summaries
- split large feature summaries into feature files
- move superseded decisions out of default view
- archive resolved known issues

### Release Compression

At release time:

- summarize shipped feature changes
- update architecture if release changed boundaries
- update API contracts
- mark temporary migration notes stale or complete
- record release verification workflow

## Stale Memory Detection

AgentKick doctor should detect stale memory signals.

Signals:

- `CURRENT_TASK.md` older than threshold and not completed
- memory references missing files
- commands in memory fail or are absent from scripts
- API contract names not found in code when expected
- feature marked active but no primary files exist
- decision review date passed
- duplicate conflicting facts
- architecture file references removed modules

Doctor output should include:

- file
- stale signal
- suggested action
- severity

## Stale Memory Cleanup

Cleanup strategy:

1. Mark stale.
2. Verify against code or owner.
3. Update current truth.
4. Move old detail to archive if useful.
5. Remove only when safe.

Agents should not delete stale memory silently.

Stale marker format:

```markdown
> Status: stale
> Reason: `src/legacy-api.js` no longer exists.
> Cleanup: verify whether this contract moved to `src/api/*`.
```

## Thread Reset Lifecycle

Thread reset is a lifecycle event.

Before reset:

- update `CURRENT_TASK.md`
- summarize progress
- list open questions
- list verification state
- save durable facts

After reset:

- read P0 memory
- read `CURRENT_TASK.md`
- read relevant P1 files
- continue from plan

No new thread should require old chat context to continue.

## Branch And Merge Behavior

Memory should follow branch workflow.

Rules:

- Feature branch memory updates stay with feature branch code.
- Memory conflicts should be resolved deliberately.
- Do not auto-merge contradictory decisions.
- Task history conflicts can usually append both entries.
- `CURRENT_TASK.md` should rarely be committed unless the branch represents ongoing work.

Recommended handling:

- Commit long-term memory updates.
- Avoid committing personal scratch state.
- Archive completed task files when useful for team continuity.

## Synchronization Lifecycle

### Local Sync

Local sync keeps files aligned:

- root compatibility files
- `.agentkick/memory/*`
- generated agent-specific files
- config source-of-truth declaration

AgentKick should warn if mirrored files diverge.

### Team Sync

Future team sync should:

- propose changes, not silently overwrite
- preserve branch context
- keep audit trail
- support approval workflows
- allow private repos to remain local-only

## Memory Review

Memory review should ask:

- Is this fact durable?
- Is it current?
- Is it in the right file?
- Is it concise?
- Is it verified?
- Does it duplicate another source of truth?
- Will a future agent benefit from reading it?

If the answer is no, keep it out of long-term memory.

## Memory Deletion

Deletion is allowed but should be careful.

Safe deletion:

- obsolete task scratch
- duplicate entries after compaction
- stale instructions replaced by current ones
- generated sections that can be reproduced

Require review:

- decisions
- architecture rationale
- API contracts
- workflow rules
- safety constraints

## Lifecycle Commands

Future CLI commands:

```bash
agentkick memory init
agentkick memory validate
agentkick memory compact
agentkick memory mark-stale
agentkick memory archive-task
agentkick memory add-decision
agentkick memory summarize-task
agentkick memory sync
```

Each command should support dry-run output before writes.

## Lifecycle Philosophy

Memory is only valuable when it stays trustworthy.

AgentKick should make memory easy to create, easy to inspect, easy to update, and easy to retire. The memory lifecycle is the discipline that turns AI task output into lasting project intelligence.
