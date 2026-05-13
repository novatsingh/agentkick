# Architecture

## Project Shape

AgentKick is a local-first TypeScript CLI for structuring AI-assisted software development workflows around a repository.

## Main Boundaries

- `src/core`: Commander program setup, config, constants, and shared types.
- `src/commands`: CLI command handlers.
- `src/detectors`: stack and capability detection.
- `src/doctor`: AI workflow readiness analysis.
- `src/templates`: generated project and agent-memory renderers.
- `src/workflow`: workflow memory, task context, summaries, and command packs.
- `src/utils`: terminal UI, filesystem, git, logging, and formatting helpers.

## Agent Rules

- Keep command handlers thin and move reusable behavior into detector, doctor, workflow, template, or utility modules.
- Do not add cloud dependencies for core workflow features.
- Keep generated memory files concise and reviewable in Git.
- Verify with `npm.cmd test` and `npm.cmd run build` after code changes.
