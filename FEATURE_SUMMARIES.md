# Feature Summaries

## CLI Foundation

- Owns: command registration, global help, error handling, command examples.
- Key files: `src/core/program.ts`, `src/index.ts`, `src/commands/*`.
- Current risks: keep command handlers small as commands grow.

## Template Generation

- Owns: project templates, generated README files, AI workflow memory in new projects.
- Key files: `src/templates/project-templates.ts`, `src/templates/agent-files.ts`.
- Current risks: `project-templates.ts` is large and should be split by template when templates expand.

## Doctor Engine

- Owns: stack detection, workflow readiness scoring, repo risk reporting.
- Key files: `src/detectors/project-detector.ts`, `src/doctor/doctor-engine.ts`.
- Current risks: keep checks workflow-focused and avoid drifting into generic linting.

## Workflow Memory

- Owns: `CURRENT_TASK.md`, focus context, workflow state, fresh-chat summaries.
- Key files: `src/workflow/memory.ts`.
- Current risks: keep summaries compact and avoid building retrieval infrastructure.
