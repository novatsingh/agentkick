# Doctor Engine

AgentKick Doctor is the AI workflow health engine for software repositories.

It analyzes whether a repo is ready for coding agents to operate with continuity, context discipline, task isolation, and persistent memory. It does not replace linters, static analyzers, type checkers, test runners, or security scanners. It evaluates the shape of the repository as an AI-native workflow environment.

AgentKick Doctor is not a semantic search engine, vector database, embedding system, GraphRAG layer, or retrieval framework.

## Mission

Detect the repository conditions that harm AI-assisted development:

- repeated project explanations
- context overflow
- giant-thread dependence
- vague task boundaries
- missing project memory
- poor execution scopes
- context-heavy architecture
- low maintainability zones
- workflow fragmentation
- stale context risk
- unclear agent operating rules

Doctor answers one question:

```text
Can coding agents work in this repo with speed, continuity, and low confusion?
```

## Product Positioning

Traditional tools optimize for human code correctness.

AgentKick Doctor optimizes for AI workflow quality:

- how much context an agent needs
- how stable task execution is
- whether memory survives thread resets
- whether changes can be scoped safely
- whether workflows are repeatable
- whether agents can verify work without guessing

It is Lighthouse for AI-readiness, ESLint for workflow risk, and Turborepo-style diagnostics for agent operating structure.

## Engine Stages

Doctor runs as a staged audit pipeline.

```text
discover -> map -> measure -> classify -> score -> recommend -> report
```

### 1. Discover

Collect cheap repo facts:

- root files
- package manifests
- lockfiles
- source directories
- framework indicators
- AgentKick config
- memory files
- agent-specific instruction files
- CI files
- scripts
- generated/vendor/build directories

Doctor must avoid expensive whole-repo interpretation by default.

### 2. Map

Create a workflow map:

- source zones
- test zones
- config zones
- generated zones
- memory zones
- task files
- agent files
- package boundaries
- feature areas when detectable

This map is not a semantic graph. It is a structural map for workflow health.

### 3. Measure

Measure AI-workflow risk signals:

- giant files
- oversized components
- deep dependency paths
- missing memory files
- missing task entry points
- weak folder organization
- low module boundaries
- repeated business logic patterns
- stale memory references
- missing verification commands
- overgrown agent instructions
- context files over budget
- broad generated/vendor exposure

### 4. Classify

Classify findings by workflow impact:

- context waste
- memory gap
- execution risk
- task isolation risk
- continuity risk
- maintainability zone
- agent confusion risk
- auto-fixable structure issue

### 5. Score

Produce the score suite:

- AI Readiness Score
- Workflow Stability Score
- Context Complexity Score
- AI Maintainability Score
- Token Waste Risk Score
- Execution Isolation Score

Scores should be transparent. Every score must link back to concrete signals.

### 6. Recommend

Recommend actions by impact:

- create memory files
- split oversized files
- document workflow commands
- add task scope files
- compact stale history
- move generated output out of default context
- add feature summaries
- isolate execution boundaries
- add pack-specific rules

Doctor recommends workflow improvements, not generic style cleanup.

### 7. Report

Report should be modern, concise, and actionable:

- score headline
- critical workflow risks
- context waste zones
- missing memory
- execution blockers
- auto-fix plan
- next command

## Command Surface

### `agentkick doctor`

Default health check for AI-readiness.

Focus:

- required memory
- agent files
- workflow commands
- basic context risk
- safety boundaries

### `agentkick analyze`

Deeper structural analysis.

Focus:

- giant files
- oversized components
- weak boundaries
- duplicated logic risk
- dependency chains
- maintainability zones

### `agentkick score`

Score-only mode for CI, dashboards, and quick checks.

Focus:

- score suite
- trend output
- JSON mode

### `agentkick workflow-report`

Narrative report for humans and agents.

Focus:

- where agents will struggle
- what to fix first
- memory and context plan
- task isolation plan

### `agentkick fix`

Safe auto-fix planner and executor.

Focus:

- scaffold missing memory files
- add missing workflow sections
- compact safe memory history
- add context exclusions
- generate fix plan before writes

## Example CLI Output

### `npx agentkick doctor`

```text
AgentKick Doctor

AI workflow readiness: 78/100  needs focus

Signal
  Memory:        62  missing CURRENT_TASK.md, API_CONTRACTS.md
  Context:       71  4 high-weight files in default agent path
  Workflow:      84  test/build commands documented
  Isolation:     69  feature work crosses 6 directories
  Maintainable:  73  2 oversized React components

Top risks
  P1 context waste       src/App.tsx has 1,420 lines and mixes routing, state, and UI
  P1 memory gap          FEATURE_SUMMARIES.md is missing
  P2 continuity risk     no TASK_HISTORY.md for completed agent work
  P2 execution scope     no current task or task manifest detected

Next best command
  agentkick fix --plan
```

### `agentkick analyze`

```text
AgentKick Analyze

Workflow map built from 184 source files.

Hot zones
  src/App.tsx                       context-heavy component
  src/services/api.ts               contract logic without API_CONTRACTS.md
  src/features/billing/*            duplicated validation across 3 files
  docs/agent-notes.md               stale memory candidate

Agent impact
  A new coding agent must load too much UI state to make a small billing change.
  Split routing, billing state, and presentation before scaling feature work.
```

### `agentkick score`

```text
AgentKick Score

AI Readiness:            78
Workflow Stability:      84
Context Complexity:      61
AI Maintainability:      73
Token Waste Risk:        68
Execution Isolation:     69

Gate: failed
Reason: Context Complexity below 70
```

### `agentkick workflow-report`

```text
AgentKick Workflow Report

This repo is close to agent-ready, but it has a context bottleneck.

Agents can understand the project rules, but feature work still depends on reading
large mixed-purpose files. Memory coverage is partial, so thread resets will lose
API and feature continuity.

Fix order
  1. Create FEATURE_SUMMARIES.md and API_CONTRACTS.md
  2. Split src/App.tsx into route shell, feature state, and UI panels
  3. Add task workflow files for active work
  4. Compact old agent notes into TASK_HISTORY.md
```

### `agentkick fix`

```text
AgentKick Fix

Plan only. No files changed.

Will create
  FEATURE_SUMMARIES.md
  API_CONTRACTS.md
  TASK_HISTORY.md
  .agentkick/context/budgets.json

Will update
  AGENTS.md                 add Memory Map
  WORKFLOW_RULES.md         add Verification and Memory Updates sections

Requires manual refactor
  src/App.tsx               oversized component, unsafe to split automatically

Apply safe fixes
  agentkick fix --safe
```

## Finding Model

Each Doctor finding should be structured:

```json
{
  "id": "context.giant-component",
  "priority": "P1",
  "category": "context-waste",
  "title": "Oversized React component",
  "file": "src/App.tsx",
  "signal": "1420 lines, 9 state groups, 6 feature branches",
  "agentImpact": "Small UI changes require loading unrelated routing and state.",
  "recommendation": "Split route shell, feature state, and UI panels.",
  "autoFix": "manual"
}
```

Current v1 findings use the same stable shape:

```json
{
  "id": "memory.missing-workflow-rules-md",
  "priority": "P0",
  "category": "memory",
  "title": "Missing workflow memory: WORKFLOW_RULES.md",
  "file": "WORKFLOW_RULES.md",
  "signal": "WORKFLOW_RULES.md was not found at the repo root.",
  "agentImpact": "Agents must infer repo rules from chat history or source files.",
  "recommendation": "Run agentkick init or add the missing file with concise agent-readable sections.",
  "autoFix": "safe-plan"
}
```

Priority levels:

```text
P0 blocks reliable agent execution
P1 causes major context or continuity waste
P2 slows agents or increases confusion risk
P3 polish and long-term maintainability
```

## Detection Domains

### Memory Coverage

Detect:

- missing `AGENTS.md`
- missing `WORKFLOW_RULES.md`
- missing `CURRENT_TASK.md` when active work is declared
- missing `ARCHITECTURE.md`
- missing `FEATURE_SUMMARIES.md`
- missing `API_CONTRACTS.md` for API-heavy repos
- missing `DECISIONS.md`
- missing `TASK_HISTORY.md`
- oversized memory files
- stale memory references
- conflicting source-of-truth files

### Context Efficiency

Detect:

- giant source files
- oversized React components
- mixed-purpose entry points
- huge markdown memory files
- raw logs in memory
- generated or vendor paths exposed to agents
- large files likely required for small tasks

### Workflow Stability

Detect:

- missing test command
- missing build command
- no verification workflow
- no review workflow
- no memory update workflow
- CI absent or undocumented
- fragmented scripts

### Execution Isolation

Detect:

- feature code spread across many unrelated directories
- no task scope file
- global state touched by unrelated features
- broad scripts that run unrelated systems
- high-risk commands without approval guidance

### AI Maintainability

Detect:

- poor folder naming
- unclear module boundaries
- duplicated business logic
- deep dependency chains
- highly coupled config
- low-cohesion files
- dead workflow docs

## Doctor Modes

### Fast Mode

Default.

- file existence
- line counts
- package scripts
- memory size
- basic structure
- obvious context waste

### Deep Mode

Optional.

- import graph shape
- component size
- duplication heuristics
- workflow path complexity
- feature boundary analysis

Deep mode still avoids semantic retrieval. It uses structural source analysis and explicit files.

### Strict Mode

CI-friendly gate.

Fails when:

- AI Readiness below threshold
- P0 findings exist
- required memory files missing
- context budget exceeded
- workflow commands missing

## Engine Boundaries

Doctor may:

- inspect files
- count lines
- parse common manifests
- parse imports where cheap
- inspect markdown structure
- validate memory conventions
- produce fix plans

Doctor must not:

- create embeddings
- build vector indexes
- perform semantic search
- infer business meaning from model-generated analysis as truth
- auto-refactor application code without explicit user request
- hide scoring reasons

## Product Standard

Doctor should feel sharp.

It should not say "your code is bad." It should say:

```text
Agents will waste context here.
Task continuity breaks here.
Execution scope is unclear here.
This memory is missing.
This workflow cannot be resumed.
```

That is workflow intelligence for AI-native development.

## v1 Output Examples

### Bad Repo

```text
AgentKick doctor
AI workflow readiness for this repository.

AI Readiness Score: 42/100
Status: blocked
Verification: not detected
Build: not detected

Detected stack:
- nextjs
- react

Top 3 risks:
- P0 memory: Missing workflow memory: AGENTS.md
  Signal: AGENTS.md was not found at the repo root.
  Agent impact: Agents must infer repo rules from chat history or source files.
  Fix: Run agentkick init or add the missing file with concise agent-readable sections.
- P1 commands: Missing verification command
  Signal: No package test script or usable .agentkick.json testCommand was found.
  Agent impact: Agents cannot prove a change worked without guessing how to verify it.
  Fix: Add a test script or document the narrowest useful testCommand in .agentkick.json.
- P1 context-waste: Oversized source file src/App.tsx
  Signal: 1280 lines, 144000 bytes.
  Agent impact: Agents will load unrelated behavior to make a small scoped change.
  Fix: Split stable helpers, UI sections, and business logic into feature-scoped modules.

Top context waste zones:
- P1 context-waste: Oversized source file src/App.tsx

Missing memory/workflow files:
- AGENTS.md
- WORKFLOW_RULES.md
- CURRENT_TASK.md

Generated/vendor paths detected:
- node_modules
- dist

Next: agentkick init --dry-run
```

### Good Repo

```text
AgentKick doctor
AI workflow readiness for this repository.

AI Readiness Score: 100/100
Status: ready
Verification: npm test
Build: npm run build

Detected stack:
- nextjs
- react
- tailwind

Top 3 risks:
- none

Top context waste zones:
- none

Missing memory/workflow files:
- none

Generated/vendor paths detected:
- node_modules
- .next

Next: agentkick focus <scope>
```

### JSON Example

```json
{
  "schemaVersion": 1,
  "command": "doctor",
  "score": 78,
  "status": "needs-review",
  "detectedStack": {
    "primary": "nextjs",
    "capabilities": ["react", "tailwind"]
  },
  "verificationCommand": "npm test",
  "buildCommand": "npm run build",
  "nextCommand": "agentkick split-task <task>",
  "findings": [
    {
      "id": "context.giant-file.src-app-tsx",
      "priority": "P1",
      "category": "context-waste",
      "title": "Oversized source file",
      "file": "src/App.tsx",
      "signal": "1280 lines, 144000 bytes.",
      "agentImpact": "Agents will load unrelated behavior to make a small scoped change.",
      "recommendation": "Split stable helpers, UI sections, and business logic into feature-scoped modules.",
      "autoFix": "manual"
    }
  ],
  "generatedVendorPaths": ["node_modules", "dist"],
  "missingMemoryFiles": [],
  "checks": [],
  "warnings": [],
  "failures": []
}
```
