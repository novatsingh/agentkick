# Failure Analysis

This document lists realistic failure modes for AgentKick and the product changes needed to avoid them.

## Failure Categories

| Category | Meaning |
| --- | --- |
| Adoption failure | Developer never runs the tool again. |
| Trust failure | Developer doubts the output or fears repo changes. |
| Context failure | AgentKick adds more context than it saves. |
| Memory failure | Stored memory becomes stale, wrong, or ignored. |
| Scope failure | AgentKick promises execution control it cannot deliver. |
| Maintenance failure | The architecture becomes too expensive to build or support. |

## P0 Failures

### Too Many Files On Init

Signal:

- `agentkick init` creates a large diff in an existing repo.
- Root contains many new markdown files.
- Developer says the repo looks messy.

Why it fails:

- The first interaction feels like process debt.
- Reviewers reject memory files before understanding value.
- Teams fear AgentKick will pollute every repo.

Mitigation:

- Default to `--minimal` behavior.
- Required files should be limited to:
  - `AGENTS.md`
  - `WORKFLOW_RULES.md`
  - `.agentkick/memory/project.md`
  - `.agentkick/memory/decisions.md`
  - `.agentkick/memory/tasks.md`
  - `.agentkick/context/manifest.json`
- Generate optional files only when the stack clearly needs them or the user asks.

### Doctor Becomes A Generic Linter

Signal:

- Findings say "file too large" without explaining agent impact.
- Output looks like maintainability advice from any code quality tool.
- Developers compare it to ESLint and ignore it.

Why it fails:

- AgentKick loses its identity.
- The value is no longer specific to AI-assisted workflows.

Mitigation:

- Every Doctor finding must answer:
  - how this wastes agent context
  - how this hurts task continuity
  - what safe workflow fix exists
- Avoid findings that cannot explain agent impact.

### Memory Becomes A Transcript Archive

Signal:

- `tasks.md` grows with raw logs.
- Failed attempts are preserved without outcome.
- Agents read old noise and repeat stale assumptions.

Why it fails:

- Persistent memory becomes another source of context overflow.
- Developers stop trusting memory files.

Mitigation:

- Enforce compressed task summaries.
- Store verified outcome, changed files, verification, and follow-up only.
- Flag raw logs and long stack traces in memory.

### Overpromising Multi-Agent Orchestration

Signal:

- Docs imply AgentKick coordinates several autonomous agents.
- Users expect conflict prevention and task scheduling.
- MVP only prints scoped context.

Why it fails:

- Product promise exceeds implementation.
- Failed merges become AgentKick's fault.

Mitigation:

- Use "scoped handoff" for MVP.
- Postpone "multi-agent orchestration" language.
- Support disjoint file scopes before agent coordination.

## P1 Failures

### Command Sprawl

Signal:

- Users see `analyze`, `score`, `workflow-report`, `prepare-task`, `split-task`, `continue`, `workflow-state`, and `compact`.
- They do not know which command matters.

Why it fails:

- The tool feels like a platform before it proves a daily habit.

Mitigation:

- MVP daily commands:
  - `init`
  - `doctor`
  - `fix --plan`
  - `fix --safe`
  - `focus`
  - `summarize`
- Fold score and analysis into `doctor`.
- Fold task preparation into `focus`.
- Fold reset support into `summarize`.

### Misleading Readiness Scores

Signal:

- A repo gets a high score because files exist, but agents still struggle.
- A rushed MVP gets a low score and the developer ignores it.

Why it fails:

- Scores lose credibility quickly.

Mitigation:

- Make score secondary to top findings.
- Show confidence and reasons.
- Separate "ship today" fixes from "scale later" fixes.
- Never reward empty memory files as complete.

### Context Focus Feels Like Retrieval

Signal:

- Docs imply AgentKick can choose the best files automatically.
- Users expect semantic relevance.
- The implementation uses globs and manifests.

Why it fails:

- AgentKick drifts into retrieval-tool expectations.

Mitigation:

- Be explicit:
  - focus uses declared files
  - focus uses manifest rules
  - focus does not semantically understand the codebase
- Make `--files` and `--feature` primary paths.

### Stale Current Task

Signal:

- `CURRENT_TASK.md` says a task is active weeks later.
- New agents load outdated scope.
- Doctor trusts stale task state.

Why it fails:

- Memory creates execution confusion instead of continuity.

Mitigation:

- Treat stale current task as a P1 finding.
- Require status, last updated date, and verification state.
- Prefer `.agentkick/memory/tasks.md` for completed work.

### Safe Fix Does Too Much

Signal:

- `agentkick fix --safe` edits app source or reorganizes folders.
- Developers fear running it.

Why it fails:

- Trust breaks on the most important command.

Mitigation:

- MVP safe fixes may only:
  - create missing AgentKick files
  - update AgentKick sections in agent files
  - add context exclusions
  - add workflow placeholders
- Source refactors must remain manual recommendations.

## P2 Failures

### Packs Become Mini Platforms

Signal:

- Adding `chrome-extension` or `nextjs` generates many files.
- Pack behavior is hard to review.

Mitigation:

- Packs should contribute small workflow deltas.
- Every pack must show a write plan before applying.

### Strict Mode Blocks Early Adoption

Signal:

- `doctor --strict` fails a fresh repo with many warnings.
- CI blocks teams before value is understood.

Mitigation:

- Strict mode should be opt-in.
- First strict gates should check only:
  - missing required memory
  - missing verification command
  - unsafe generated context exposure
  - P0 findings

### SaaS Language Creates Cloud Fear

Signal:

- Developers think AgentKick uploads repo data.
- Security-conscious users avoid the tool.

Mitigation:

- Put local-first language in CLI and README.
- Future SaaS should be described as optional reporting, not required workflow.

### Memory Ownership Is Unclear

Signal:

- Humans and agents both edit memory, but no one reviews it.
- Memory changes merge without scrutiny.

Mitigation:

- Treat memory diffs like code diffs.
- Doctor should flag unreviewed or oversized memory changes only when detectable.

## Failure Matrix

| Failure | Severity | Likelihood | First Fix |
| --- | --- | --- | --- |
| Too many init files | P0 | High | Minimal scaffold |
| Generic Doctor output | P0 | Medium | Require agent impact |
| Transcript memory | P0 | High | Summary format |
| Multi-agent overpromise | P0 | Medium | Rename to handoff |
| Command sprawl | P1 | High | Collapse commands |
| Misleading scores | P1 | Medium | Findings first |
| Retrieval expectation | P1 | Medium | Explicit focus rules |
| Stale task state | P1 | High | Staleness checks |
| Overactive safe fix | P1 | Low | Write boundaries |
| Pack bloat | P2 | Medium | Pack write plans |

## Failure Conclusion

AgentKick fails if it asks developers to maintain a process system.

It wins if it quietly makes the repo easier for agents to enter, scope, verify, and resume.
