# Workflow Rules

## Agent Startup

1. Read `AGENTS.md`.
2. Read `CURRENT_TASK.md`.
3. Read `ARCHITECTURE.md`.
4. Read the relevant feature section in `FEATURE_SUMMARIES.md`.
5. Open only the files needed for the scoped task.

## Update Rules

- Use `agentkick focus <scope>` before implementation when the task has a feature scope.
- Update `CURRENT_TASK.md` when the active scope changes.
- Add durable technical decisions to `DECISIONS.md`.
- Add completed verified work to `TASK_HISTORY.md`.

## Boundaries

- Do not add retrieval, embeddings, vector search, or GraphRAG infrastructure.
- Keep AgentKick local-first and repo-native.
- Prefer small, reviewable changes over broad rewrites.
