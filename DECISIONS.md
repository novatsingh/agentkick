# Decisions

## 2026-05-13

- Decision: AgentKick is a local-first workflow memory and context orchestration CLI.
- Context: The product should structure AI-assisted development workflows around repositories.
- Consequences: Avoid cloud-first features, retrieval infrastructure, embeddings, and generic AI-wrapper behavior in the core CLI.

## 2026-05-13

- Decision: Node.js 20+ is the supported runtime baseline.
- Context: Current dependencies and modern CLI tooling expect a modern Node runtime.
- Consequences: Users on older Node versions must upgrade before installing AgentKick.
