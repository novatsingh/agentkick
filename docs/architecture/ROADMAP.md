# Roadmap

This roadmap turns AgentKick from a compact CLI into a production-grade AI workflow operating system.

The order prioritizes local-first value, workflow clarity, and architecture that can support future SaaS without forcing it early.

## Phase 0: Current Seed

Status: started.

Current capabilities:

- Node CLI
- `new`
- `init`
- `add`
- `doctor`
- stack templates
- workflow packs
- generated agent files
- basic profile detection
- dry-run mode
- backup-on-overwrite behavior

Primary limitation:

- architecture is still concentrated in one package
- memory is not yet a first-class system
- task orchestration is not yet modeled
- context lifecycle is implicit
- plugins are not formalized

## Phase 1: Foundation Hardening

Goal: make the current CLI reliable, testable, and ready for modular growth.

Deliverables:

- Add unit tests for profile detection, file writes, and doctor scoring.
- Add integration fixtures for `new`, `init`, `add`, and `doctor`.
- Convert generated output behavior into tested product contracts.
- Add schema validation for `.agentkick.json`.
- Improve dry-run output into a clear file operation plan.
- Add safer conflict handling for existing generated files.
- Document generated file ownership and editing rules.

Success criteria:

- CLI behavior is covered by fixtures.
- Existing generated output is stable and intentional.
- New templates and packs can be added without fear of regressions.

## Phase 2: Persistent Memory MVP

Goal: introduce durable repo memory without overbuilding infrastructure.

Deliverables:

- Add `.agentkick/memory/` scaffold.
- Create memory files:
  - `project.md`
  - `architecture.md`
  - `known-issues.md`
  - `workflows/`
  - `decisions/`
  - `tasks/`
- Add `agentkick memory validate`.
- Add `agentkick memory add-decision`.
- Add `agentkick memory summarize-task`.
- Add doctor checks for missing or oversized memory.
- Update generated agent files to reference memory entry points.

Success criteria:

- A new agent can understand project facts without reading a long thread.
- Memory remains plain markdown and easy to review.
- Doctor can distinguish missing memory from missing agent instructions.

## Phase 3: Context Lifecycle MVP

Goal: make context explicit and token-efficient.

Deliverables:

- Add `.agentkick/context/manifest.json`.
- Add `.agentkick/context/budgets.json`.
- Add `agentkick context preview`.
- Define always-load, task-load, conditional-load, and avoid-load policies.
- Add pack-contributed context rules.
- Add doctor warnings for broad or noisy context.
- Add generated/vendor/build exclusion defaults.

Success criteria:

- Users can preview what an agent should read before a task.
- Context rules reduce repeated explanations.
- AgentKick provides clarity without building a search system.

## Phase 4: Task Orchestration MVP

Goal: make tasks first-class and resumable.

Deliverables:

- Add `.agentkick/tasks/`.
- Add `agentkick task new`.
- Add task schema with id, type, scope, status, constraints, context, verification, and outcome.
- Add task types:
  - bug fix
  - feature
  - refactor
  - security review
  - deployment debugging
  - release preparation
- Add `agentkick task status`.
- Add `agentkick task close`.
- Add task completion summaries that can update memory.

Success criteria:

- Work can be paused and resumed without relying on a huge chat.
- Agents receive task-specific operating instructions.
- Completed work produces a concise memory trail.

## Phase 5: Monorepo Migration

Goal: split the codebase into stable internal packages.

Deliverables:

- Introduce package workspace.
- Move CLI shell into `packages/cli`.
- Move safe writes into `packages/fs`.
- Move doctor into `packages/doctor`.
- Move profile detection and operation planning into `packages/core`.
- Move template logic into `packages/templates`.
- Move pack logic into `packages/packs`.
- Move agent file renderers into `packages/agent-interop`.
- Preserve the public `agentkick` CLI package.

Success criteria:

- Public CLI behavior remains compatible.
- Internal package boundaries are clear.
- Tests pass across generated fixtures before and after migration.

## Phase 6: Plugin System

Goal: allow third-party and team-specific workflow extensions safely.

Deliverables:

- Define `agentkick.plugin.json`.
- Add plugin manifest validation.
- Add `agentkick plugin list`.
- Add `agentkick plugin validate`.
- Add local plugin install.
- Add plugin lock file.
- Support plugin contributions:
  - packs
  - templates
  - doctor checks
  - context policies
  - memory schemas
  - workflows
- Add permission declarations for plugin file writes.

Success criteria:

- Plugins are inspectable before use.
- Plugin writes are dry-runnable.
- Teams can create internal workflow packs without modifying AgentKick core.

## Phase 7: Advanced Doctor

Goal: turn doctor into a serious AI-readiness audit.

Deliverables:

- Add memory quality score.
- Add context quality score.
- Add task workflow readiness score.
- Add plugin health checks.
- Add MCP/tool safety checks with clearer remediation.
- Add CI mode.
- Add trend-friendly JSON output.
- Add `agentkick doctor --fix-plan` to show recommended operations without applying them.

Success criteria:

- Doctor is useful in CI and local development.
- Teams can enforce baseline AI-readiness.
- Output stays concise and actionable.

## Phase 8: Workflow Pack Expansion

Goal: make AgentKick valuable across common production stacks.

Deliverables:

- Supabase pack
- Render pack
- Stripe pack
- Vercel pack
- Django pack
- Rails pack
- Astro pack
- accessibility pack
- performance pack
- release pack
- migration pack

Success criteria:

- Packs feel like domain-specific operating systems for agents.
- Each pack contributes workflows, checks, context policy, and memory guidance.
- Packs remain modular and removable.

## Phase 9: Team And SaaS Readiness

Goal: prepare for hosted collaboration without weakening local-first behavior.

Deliverables:

- Organization policy schema.
- Team pack registry model.
- Doctor report upload format.
- Memory review proposal model.
- Task event model.
- Optional authenticated sync.
- Privacy and redaction rules.

Success criteria:

- SaaS can be added as a layer above local repos.
- Local CLI remains fully useful offline.
- Teams can standardize AgentKick usage across many repos.

## Phase 10: Agent Workflow Studio

Goal: provide a visual surface for workflows, context, and memory.

Deliverables:

- Context preview UI.
- Memory editor.
- Task workflow builder.
- Doctor dashboard.
- Plugin inspector.
- Pack browser.

Success criteria:

- Advanced AgentKick concepts become easier to understand.
- The CLI remains the source of truth for automation.
- Studio improves visibility without hiding files from developers.

## Strategic Milestones

### MVP

- Reliable CLI
- tested generated output
- memory scaffold
- doctor strict mode
- core packs

### Developer Beta

- context preview
- task orchestration MVP
- memory write-back
- plugin manifest validation
- expanded stack packs

### Team Beta

- organization policies
- shared pack registry model
- doctor JSON reporting
- task and memory review workflows

### Production Platform

- stable plugin SDK
- hosted dashboards
- workflow studio
- team governance
- robust migrations

## Product Rule

Every roadmap item must strengthen one of these:

- persistent memory
- task isolation
- context optimization
- workflow repeatability
- agent interoperability
- local-first safety

If a feature does not strengthen one of those areas, it does not belong in AgentKick.
