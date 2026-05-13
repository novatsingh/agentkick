# Adoption Barriers

This document identifies why real developers might not adopt AgentKick and how to reduce those barriers.

## Barrier 1: "Another Tool In My Repo"

User:

- indie hacker
- startup engineer
- open-source maintainer

Concern:

- new config files
- more docs to maintain
- possible repo clutter

Required response:

- minimal init
- local-only
- reviewable diff
- no account
- no source refactor

Product proof:

```bash
npx agentkick init --minimal
git diff
```

If the diff is not easy to understand, adoption fails.

## Barrier 2: "My AI Editor Already Has Context"

User:

- Cursor user
- Claude Code user
- Copilot user

Concern:

- the editor already reads files
- AgentKick sounds redundant

Required response:

AgentKick is not the agent and not a code reader. It makes the repo carry durable operating memory so any agent can start faster and survive thread resets.

Proof points:

- `AGENTS.md` for operating rules
- `.agentkick/memory/tasks.md` for completed work
- context manifest for files to avoid
- Doctor for workflow readiness

## Barrier 3: "This Feels Like Documentation Work"

User:

- rushed founder
- tired engineer
- product-focused builder

Concern:

- writing memory files sounds slower than prompting again

Required response:

AgentKick should write the first scaffold and keep summaries short.

The user should not be asked to maintain a wiki.

Daily habit:

```bash
agentkick doctor
agentkick summarize --task "..."
```

If summaries take more than a minute, they will not happen.

## Barrier 4: "Will This Upload My Code?"

User:

- enterprise developer
- security-conscious team
- private repo owner

Concern:

- AI tooling often implies cloud upload

Required response:

- local-first by default
- no hosted dependency for core workflow
- no repo upload required
- Doctor JSON is local unless user exports it

CLI should say this where it matters:

```text
Local scan only. No repo data uploaded.
```

## Barrier 5: "The Score Is Fake"

User:

- senior engineer
- skeptical maintainer

Concern:

- AI-readiness sounds subjective

Required response:

- score must link to concrete findings
- findings must be inspectable
- output must admit uncertainty
- score must never replace human judgment

Better than a dashboard score:

```text
AI readiness: 72/100
Main reason: 3 context-heavy files and missing verification workflow.
```

## Barrier 6: "This Will Slow Shipping"

User:

- early-stage founder
- hackathon builder
- agency developer

Concern:

- structure fights momentum

Required response:

- ship-mode recommendations
- fix-now versus fix-later
- no mandatory task ceremony

Doctor should not tell a founder to refactor during a production hotfix unless the refactor is required.

## Barrier 7: "Our Repo Is Too Messy"

User:

- team inheriting legacy code
- contractor joining late

Concern:

- AgentKick will produce a wall of warnings

Required response:

- prioritize first useful fix
- avoid shaming language
- support partial adoption

Output should say:

```text
Start here.
```

Not:

```text
This repo is not AI-ready.
```

## Barrier 8: "We Already Have Team Process"

User:

- engineering manager
- platform team

Concern:

- AgentKick conflicts with existing docs, CI, and review rules

Required response:

- AgentKick should read existing scripts and docs when possible
- generated workflow files should point to existing processes
- no forced replacement

Adoption path:

1. run Doctor locally
2. add context exclusions
3. add agent operating file
4. add memory only where repeated explanation is painful

## Barrier 9: "Multi-Agent Sounds Risky"

User:

- team lead
- maintainer

Concern:

- autonomous agents can conflict, overwrite, or expand scope

Required response:

- MVP does not run agents
- AgentKick scopes work and records handoffs
- human review remains required

Avoid selling orchestration before scoped handoffs work.

## Barrier 10: "I Do Not Want Another SaaS"

User:

- open-source maintainer
- enterprise security team
- solo developer

Concern:

- free CLI becomes hosted lock-in

Required response:

- open-source core
- local files as source of truth
- optional future SaaS for team visibility only
- no hosted requirement for Doctor, focus, or summarize

## Persona-Specific Adoption Notes

### Indie Hacker

Wants:

- faster AI tasks
- fewer repeated explanations
- clean enough repo to keep shipping

Adoption hook:

```bash
npx agentkick doctor
```

Avoid:

- enterprise governance
- long setup
- too many files

### Startup Founder

Wants:

- AI agents that do not lose the plot
- safe handoffs between sessions
- quick bug fixes

Adoption hook:

- reset-ready task summaries
- safe fix plans
- ship-mode Doctor output

### AI-Heavy Engineer

Wants:

- consistent rules across Codex, Cursor, Claude Code
- context exclusions
- task scopes

Adoption hook:

- agent operating files
- focus output that can be pasted into any agent

### Team Lead

Wants:

- fewer messy AI-generated changes
- repeatable verification
- reviewable memory changes

Adoption hook:

- `doctor --strict` after local trust is established
- GitHub workflow later, not day one

## Adoption Strategy

Adoption should move in stages:

1. Prove value with `doctor`.
2. Build trust with minimal `init`.
3. Make `fix --plan` safe and reviewable.
4. Make `focus` useful with explicit files.
5. Make `summarize` fast enough to become habit.
6. Add packs only after core usage is understood.

## Adoption Conclusion

Developers will adopt AgentKick if it feels like a small practical advantage inside tools they already use.

They will reject it if it feels like a new process religion.
