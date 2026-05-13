# Workflow Simulations

This document stress-tests AgentKick against realistic developer behavior.

The goal is not to prove the architecture works in perfect demos. The goal is to find where tired developers, messy repos, long AI threads, and rushed product work would break the workflow.

## Simulation Standard

Each simulation assumes:

- incomplete docs
- stale comments
- unclear ownership
- long AI chats
- pressure to ship
- mixed human and agent edits
- limited patience for process

AgentKick succeeds only when it improves the next action without asking developers to become process managers.

## Scenario 1: Cursor User In A Messy SaaS Repo

### Setup

A founder has a Next.js SaaS repo with:

- `src/app/page.tsx` at 1,200 lines
- billing logic duplicated in UI and API routes
- old Stripe notes in `docs/`
- no current architecture document
- several Cursor chats with different assumptions
- one urgent bug: coupon validation is broken for annual plans

### Real Behavior

The developer opens Cursor, pastes the bug, and expects the agent to fix it. They do not want to run five commands first.

Likely action:

```bash
npx agentkick doctor
```

They will skip anything that sounds ceremonial.

### Useful AgentKick Flow

```bash
npx agentkick init
npx agentkick doctor
npx agentkick focus --files src/app/api/billing/checkout/route.ts src/lib/billing.ts
```

AgentKick should produce:

- one memory map in `AGENTS.md`
- a concise warning that billing changes require API contract memory
- a context package that excludes generated Next output
- a clear "manual refactor later" note for the giant page file

### Where It Breaks

- If `init` creates too many root docs, the founder rejects the diff.
- If Doctor reports generic maintainability issues, they ignore it.
- If `focus` asks for task ids before accepting files, they abandon it.
- If AgentKick implies it understands billing semantics, trust drops.

### Product Correction

Make the first-run path tolerant:

```bash
npx agentkick doctor
```

If no AgentKick files exist, Doctor should still inspect the repo and say:

```text
This repo is not initialized.
Run: npx agentkick init --minimal
```

The primary CTA should be one safe command, not a workflow lecture.

## Scenario 2: Codex Working On A Chrome Extension

### Setup

A Chrome extension repo contains:

- `manifest.json`
- `popup.html`
- `popup.js`
- `background.js`
- a bundled zip from a previous release
- screenshots and generated assets
- no reliable local verification notes

The user asks Codex to fix a broken popup CTA.

### Real Behavior

The agent reads too much:

- release zip contents
- generated assets
- old packaged files
- stale notes
- current source files

The thread grows quickly because browser verification produces long logs and screenshots.

### Useful AgentKick Flow

```bash
agentkick add chrome-extension
agentkick doctor
agentkick focus --feature popup --files popup.html popup.js manifest.json
agentkick summarize --task "Fix popup CTA"
```

AgentKick should:

- mark release zips and `dist/` as excluded
- record extension verification steps
- warn if `manifest.json` permissions are broad
- keep popup-specific notes compact

### Where It Breaks

- The chrome-extension pack may be too broad if it adds many docs.
- `summarize` may become a transcript dump if not constrained.
- Doctor may over-warn on generated release files that are intentionally present.
- Agents may forget to update memory after manual browser testing.

### Product Correction

Chrome extension packs should default to:

- `AGENTS.md` additions
- `.agentkick/context/manifest.json` exclusions
- a short verification workflow

Avoid creating extension-specific architecture docs unless requested.

## Scenario 3: Claude Code Debugging A Production Incident

### Setup

A backend API is failing only in production. The repo has:

- Node service
- environment-specific config
- Dockerfile
- partial deploy notes
- no current task file
- a long chat where several theories were already tested

### Real Behavior

The user wants immediate root cause work. They will not pause to write perfect memory.

### Useful AgentKick Flow

```bash
agentkick focus --files src/server.ts src/config.ts Dockerfile
agentkick summarize --task "Production config incident"
```

AgentKick should support "late capture":

- work can begin without a prepared task
- summary can record verified root cause after the fact
- `doctor` can later recommend missing deployment workflow memory

### Where It Breaks

- If AgentKick requires task preparation before helping, it loses incident use cases.
- If it stores every failed theory, memory becomes polluted.
- If it cannot distinguish verified findings from guesses, future agents will be misled.

### Product Correction

`summarize` must require evidence language:

```text
Verified
Unverified
Changed
Still unknown
```

This prevents incident memory from becoming a pile of speculation.

## Scenario 4: Rushed MVP With Chaotic Vibe Coding

### Setup

An indie hacker builds a marketplace MVP in two days:

- all product logic in one React file
- Supabase calls inside components
- no tests
- no deploy checklist
- prompt history is the only source of product decisions

### Real Behavior

The developer is willing to accept structure only if it helps shipping today.

### Useful AgentKick Flow

```bash
npx agentkick init --minimal
npx agentkick doctor
npx agentkick fix --plan
```

Doctor should say:

- what is blocking agent reliability now
- what can wait
- what not to refactor during MVP pressure

### Where It Breaks

- A low score can feel demotivating or irrelevant.
- Too many findings create guilt instead of action.
- Refactor recommendations can derail shipping.

### Product Correction

Doctor output needs a "ship mode":

```text
Fix today
  Add verification command.
  Exclude generated files.
  Create project memory.

Postpone
  Split giant component after launch.
  Add feature summaries after first users.
```

The CLI should protect momentum.

## Scenario 5: Monorepo With Multiple Apps

### Setup

A monorepo has:

- `apps/web`
- `apps/admin`
- `packages/ui`
- `packages/billing`
- `packages/db`
- mixed package managers from old migrations
- scattered AI instructions

The task is to update billing copy in the web app.

### Real Behavior

Agents over-read because the repo looks interconnected.

### Useful AgentKick Flow

```bash
agentkick doctor
agentkick focus --files apps/web/src/billing/page.tsx packages/ui/src/pricing-card.tsx
```

AgentKick should:

- show package boundaries
- avoid scanning all apps by default
- identify missing root operating rules
- warn about conflicting package manager signals

### Where It Breaks

- True monorepo support can become a package graph project.
- Developers may expect dependency-aware magic.
- A context package can be wrong if it ignores shared UI contracts.

### Product Correction

MVP monorepo behavior should stay explicit:

- accept file and folder scopes
- read package manifests
- avoid semantic dependency promises
- show uncertainty clearly

## Scenario 6: Thread Reset After A Giant AI Chat

### Setup

A Codex thread has:

- 70 turns
- several partial attempts
- changed files
- one failing test
- user corrections
- unclear final plan

The agent starts losing accuracy.

### Real Behavior

The user does not want to restart, but the thread is degraded.

### Useful AgentKick Flow

```bash
agentkick summarize --task "Checkout retry fix"
agentkick focus --task checkout-retry
```

AgentKick should produce a reset-ready handoff:

- current goal
- files touched
- what changed
- what failed
- exact next command
- open decision

### Where It Breaks

- If summary is too long, the next thread inherits the same bloat.
- If summary hides failure state, the next agent repeats work.
- If memory is not committed with code, handoff disappears.

### Product Correction

`summarize` should enforce a compact shape and flag missing verification:

```text
Status: blocked
Verification: failing
Next command: npm test -- checkout
Do not assume task is complete.
```

## Scenario 7: Multi-Agent Work In A Startup Repo

### Setup

A team tries to run two agents:

- one fixes billing
- one redesigns onboarding
- both touch shared settings
- no branch policy
- no task ownership docs

### Real Behavior

The agents conflict. The team blames the tool if AgentKick promised orchestration.

### Useful AgentKick Flow

MVP should not promise multi-agent execution.

It can support:

```bash
agentkick focus --files packages/billing/**
agentkick focus --files apps/web/src/onboarding/**
```

### Where It Breaks

- "Multi-agent orchestration" creates expectations of scheduling and conflict resolution.
- Shared files still require human review.
- Context packages do not prevent merge conflicts.

### Product Correction

Describe this as scoped handoff support, not orchestration.

Postpone real multi-agent features until single-agent memory and focus are trusted.

## Scenario 8: New Developer Onboarding

### Setup

A developer clones a repo and sees AgentKick files. They have never used the tool.

### Real Behavior

They ask:

- What is this?
- Will it change my code?
- Do I need an account?
- Is this replacing my AI editor?

### Useful AgentKick Flow

```bash
npx agentkick doctor
```

Doctor should answer:

- local-only
- no account required
- no source refactors from Doctor
- next safe fix

### Where It Breaks

- Too many unfamiliar terms.
- Root clutter looks like bureaucracy.
- A failing strict gate before value is proven creates resentment.

### Product Correction

The docs and CLI should use simple terms:

- repo memory
- context manifest
- safe fix plan
- verification command

Avoid "workflow operating system" inside error output. Use it for positioning, not daily command text.

## Cross-Simulation Findings

The same patterns appear repeatedly:

- developers tolerate `doctor` before they tolerate workflow ceremony
- explicit file scopes beat inferred task systems in MVP
- memory must be short or it becomes context waste
- reset support is valuable only when it preserves failure state
- packs should change little by default
- Doctor must explain agent impact, not generic code quality
- multi-agent language is risky before the single-agent path is excellent

## Simulation Conclusion

The daily product should feel like:

```bash
agentkick doctor
agentkick fix --plan
agentkick focus --files ...
agentkick summarize --task ...
```

Everything else is secondary until this loop is useful on messy repos.
