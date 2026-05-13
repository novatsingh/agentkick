# Implementation Plan

AgentKick should move from a compact CLI into a production-grade AI workflow operating system through narrow, shippable phases.

The implementation must protect the core positioning:

```text
AgentKick is the workflow operating system for AI-native software development.
```

It should not become an AI coding wrapper, retrieval engine, vector database layer, semantic repo search tool, or indexing competitor.

## Implementation Priorities

### Priority 1: Stabilize The Existing CLI

Goal: make current behavior dependable before adding new surfaces.

Deliverables:

- Add fixture tests for `new`, `init`, `add`, and `doctor`.
- Add snapshot tests for generated agent files.
- Add schema validation for `.agentkick.json`.
- Make write plans explicit before file writes.
- Preserve backup behavior.
- Improve error messages around filesystem permissions and existing files.

Complexity: medium.

Risk: low.

Why first:

- Every future feature depends on safe file generation.
- Developers must trust AgentKick before allowing it to touch repos.

### Priority 2: Memory Scaffold MVP

Goal: make persistent project memory real.

Deliverables:

- Create `.agentkick/memory/`.
- Generate root compatibility files or managed memory files based on config.
- Add memory templates for project, architecture, workflows, decisions, tasks, features, and contracts.
- Add `agentkick memory validate`.
- Add Doctor checks for missing and oversized memory.

Complexity: medium.

Risk: medium.

Risk control:

- Do not infer business behavior.
- Generate structure and placeholders only.
- Keep all files human-editable.

### Priority 3: Doctor V2

Goal: turn Doctor into the daily readiness check.

Deliverables:

- Add AI readiness score components.
- Add memory coverage checks.
- Add context waste checks for giant files and oversized components.
- Add workflow health rules.
- Add JSON output for CI.
- Add `agentkick fix --plan` and `agentkick fix --safe`.

Complexity: medium-high.

Risk: medium.

Risk control:

- Keep findings explainable.
- Label heuristic findings as heuristic.
- Avoid code refactors in auto-fix.

### Priority 4: Context Engine MVP

Goal: prepare focused task context without building search infrastructure.

Deliverables:

- Add `.agentkick/context/manifest.json`.
- Add `.agentkick/context/budgets.json`.
- Add `agentkick focus`.
- Add `agentkick prepare-task`.
- Add task context package output.
- Add default avoid-load rules.

Complexity: high.

Risk: high.

Risk control:

- Start with explicit files, globs, memory priorities, and task types.
- Avoid semantic interpretation.
- Keep output inspectable.

### Priority 5: Task Orchestration MVP

Goal: make work resumable.

Deliverables:

- Add `.agentkick/workflows/active/<task-id>/`.
- Add `agentkick split-task`.
- Add `agentkick workflow-state`.
- Add `agentkick continue`.
- Add `agentkick reset-context`.
- Add handoff summaries.

Complexity: high.

Risk: high.

Risk control:

- Implement file-backed state first.
- Do not require background services.
- Keep one active task path simple.

### Priority 6: Plugin SDK

Goal: let teams extend AgentKick without changing core.

Deliverables:

- Define `agentkick.plugin.json`.
- Add plugin validation.
- Add plugin lock file.
- Add plugin contribution points for packs, templates, Doctor checks, memory schemas, and context policies.
- Add permission declarations.

Complexity: high.

Risk: medium-high.

Risk control:

- Plugins are declarative first.
- Executable hooks require explicit permission.
- Dry-run all writes.

## Technical Risk Analysis

### Risk: AgentKick Becomes Too Broad

Mitigation:

- Every feature must strengthen workflow memory, task isolation, context optimization, agent interoperability, or local-first safety.
- Reject generic AI wrapper features.

### Risk: Doctor Feels Like A Noisy Linter

Mitigation:

- Findings must explain agent impact.
- Prioritize P0/P1 workflow blockers.
- Keep P3 suggestions quiet by default.

### Risk: Memory Becomes Documentation Debt

Mitigation:

- Add stale memory checks.
- Add compact commands.
- Keep memory files small.
- Make memory updates part of task close.

### Risk: Context Engine Drifts Into Retrieval

Mitigation:

- Use explicit scopes, priorities, manifests, and budgets.
- Avoid embeddings, vector indexes, GraphRAG, and semantic search claims.

### Risk: Auto-Fix Damages Trust

Mitigation:

- Plan-first.
- Safe mode only for scaffolds and managed sections.
- Never refactor app code automatically.
- Always preserve backups.

## Engineering Sequence

1. Add tests around current behavior.
2. Add config schema and write-plan model.
3. Add memory scaffold and validation.
4. Add Doctor V2 scoring.
5. Add safe fix plan.
6. Add context manifest and focus command.
7. Add task state files.
8. Add plugin manifest validation.
9. Add CI and GitHub integration.
10. Prepare public launch docs and examples.

## Compatibility Strategy

### Codex And Cursor

Codex and Cursor compatibility should remain file-native:

- Codex reads `AGENTS.md` and `.codex/agents/*`.
- Cursor reads `.cursor/rules/*`.
- Both should benefit from the same AgentKick memory and workflow files.
- Agent-specific files are render targets, not competing sources of truth.

### GitHub

GitHub integration should start with files and CI:

- generated Copilot instructions
- GitHub Actions workflow for Doctor
- PR comments for readiness findings
- README badge
- issue templates for P0/P1 workflow health risks

### VSCode Extension Possibilities

Do not build a VSCode extension for MVP.

Later, a VSCode extension can provide:

- Doctor panel
- context package preview
- current task sidebar
- memory file shortcuts
- workflow-state visualization
- one-click `agentkick focus`

The extension should call the CLI and read repo files. It should not become a separate source of project memory.

### Repo-Native Execution Model

Every workflow artifact should live in the repo:

- memory
- context manifests
- workflow state
- task handoffs
- Doctor reports when committed or exported

This keeps AgentKick portable across Codex, Cursor, Claude Code, Copilot, terminals, CI, and future agents.

## Done Criteria

MVP is done when:

- `npx agentkick init` creates useful agent operating files.
- `npx agentkick doctor` explains AI workflow readiness.
- `agentkick fix --safe` can scaffold missing memory and workflow docs.
- `agentkick focus` can produce a small task context package.
- all changes are local-first and reviewable in Git.
