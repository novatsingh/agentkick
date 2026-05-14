import type { ProjectProfile } from "../core/types.js";
import { json, writeFile } from "../utils/fs.js";

export { buildFocusContext, buildWorkflowSummary } from "./context.js";
export { renderFocus, renderSummary } from "./context-render.js";

type WorkflowState = {
  schemaVersion: 1;
  project: string;
  activeScope: string;
  updatedAt: string;
  stack: string[];
  scopedFiles: string[];
};

export function writeWorkflowMemoryFiles(cwd: string, profile: ProjectProfile) {
  writeFile(
    cwd,
    "CURRENT_TASK.md",
    `# Current Task

## Status

No active task.

## Active Scope

- Project: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Verification: ${profile.testCommand}

## Scoped Files

- None yet.

## Update Rule

Keep this file focused on the active task, touched files, blockers, and verification status.
`
  );
  writeFile(
    cwd,
    "ARCHITECTURE.md",
    `# Architecture

## Project Shape

${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared for AI-assisted development.

## Agent Boundaries

- Read \`AGENTS.md\` before broad edits.
- Keep task changes scoped to the smallest relevant module.
- Move durable decisions into \`DECISIONS.md\`.
- Move completed task notes into \`TASK_HISTORY.md\`.
`
  );
  writeFile(
    cwd,
    "FEATURE_SUMMARIES.md",
    `# Feature Summaries

Keep compact notes for each important feature.

## Format

- Feature:
- Owns:
- Key files:
- Current risks:
`
  );
  writeFile(
    cwd,
    "WORKFLOW_RULES.md",
    `# Workflow Rules

## Agent Startup

1. Read \`AGENTS.md\`.
2. Read \`CURRENT_TASK.md\`.
3. Read \`ARCHITECTURE.md\`.
4. Open only files needed for the scoped task.

## Updates

- Update \`CURRENT_TASK.md\` when scope changes.
- Add durable decisions to \`DECISIONS.md\`.
- Add completed work to \`TASK_HISTORY.md\`.
`
  );
  writeFile(
    cwd,
    "DECISIONS.md",
    `# Decisions

Record durable technical and product decisions here. Keep entries short enough for agents to scan.

## Format

- Date:
- Decision:
- Context:
- Consequences:
`
  );
  writeFile(
    cwd,
    "TASK_HISTORY.md",
    `# Task History

Record completed, verified work here.

## Entries

- No completed tasks yet.
`
  );
}

export function writeInitialWorkflowState(cwd: string, profile: ProjectProfile) {
  const state: WorkflowState = {
    schemaVersion: 1,
    project: profile.name,
    activeScope: "none",
    updatedAt: new Date().toISOString(),
    stack: profile.stack,
    scopedFiles: []
  };
  writeFile(cwd, ".agentkick/workflow-state.json", json(state));
}
