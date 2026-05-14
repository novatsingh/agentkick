import type { ProjectProfile } from "../core/types.js";
import type { TemplateDefinition, TemplateFile } from "./template-types.js";

export function sharedMemoryFiles(profile: ProjectProfile, template: TemplateDefinition): TemplateFile[] {
  return [
    {
      path: "CURRENT_TASK.md",
      content: `# Current Task

## Status

No active task.

## Active Scope

- Template: {{templateLabel}}
- Project: {{projectTitle}}
- Primary stack: ${profile.stack.join(", ")}

## Next Execution

- Run \`${profile.testCommand}\` before handing work back.
- Keep task notes short and move completed work into \`TASK_HISTORY.md\`.
- Start each new agent session by reading \`AGENTS.md\`, \`CURRENT_TASK.md\`, and \`ARCHITECTURE.md\`.
`
    },
    {
      path: "ARCHITECTURE.md",
      content: `# Architecture

## System Shape

{{projectTitle}} is a {{templateLabel}} project generated for AI-assisted development.

## Boundaries

- \`src/core\`: shared primitives, configuration, and framework-neutral helpers.
- \`src/features\`: feature modules with local UI, workflow, and service code.
- \`src/app\` or \`app\`: route and composition layer.
- \`src/shared\`: small reusable utilities that are stable across features.
- \`docs\`: product, workflow, and launch notes.

## Agent Rules

- Edit inside one feature boundary when possible.
- Move reusable behavior to \`src/core\` only after two real call sites exist.
- Keep route handlers thin and push business behavior into feature modules.
- Do not add cross-feature imports without documenting the dependency here.
`
    },
    {
      path: "WORKFLOW_RULES.md",
      content: `# Workflow Rules

## Context Loading

1. Read \`AGENTS.md\`.
2. Read \`CURRENT_TASK.md\`.
3. Read the feature README for the scoped module.
4. Open only the files required for the task.

## Update Rules

- Update \`CURRENT_TASK.md\` when task scope changes.
- Add durable decisions to \`DECISIONS.md\`.
- Add completed task notes to \`TASK_HISTORY.md\`.
- Keep generated memory concise. Prefer bullets over long prose.

## Execution Discipline

- One task, one feature scope, one verification command.
- Avoid broad rewrites during focused fixes.
- Do not mix product, auth, billing, and database changes in the same task unless explicitly requested.
`
    },
    {
      path: "FEATURE_SUMMARIES.md",
      content: `# Feature Summaries

Keep one short section per feature. Each section should explain ownership, important files, and current risks.

## Template Features

- Project type: {{templateLabel}}
- Source boundaries are documented in \`ARCHITECTURE.md\`.
- Add feature entries when implementation begins.
`
    },
    {
      path: "DECISIONS.md",
      content: `# Decisions

Record durable technical and product decisions here. Keep entries short enough for agents to scan.

## Format

- Date:
- Decision:
- Context:
- Consequences:
`
    },
    {
      path: "TASK_HISTORY.md",
      content: `# Task History

Record completed work here after it is verified.

## Entries

- No completed tasks yet.
`
    },
    {
      path: "docs/PROJECT_MAP.md",
      content: `# Project Map

## Template

- Type: {{templateLabel}}
- Description: ${template.description}

## First Files To Read

- \`AGENTS.md\`
- \`CURRENT_TASK.md\`
- \`ARCHITECTURE.md\`
- \`WORKFLOW_RULES.md\`
`
    }
  ];
}

export function gitignoreFor(profile: ProjectProfile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/", "*.agentkick-backup"];
  const stackItems: string[] = ["node_modules/"];
  if (profile.stack.includes("nextjs")) stackItems.push(".next/", "out/");
  if (profile.stack.includes("vite")) stackItems.push(".vite/");
  if (profile.stack.includes("electron")) stackItems.push("release/");
  if (profile.stack.includes("tauri")) stackItems.push("src-tauri/target/");
  return `${[...new Set([...common, ...stackItems])].join("\n")}\n`;
}

export function variablesFor(profile: ProjectProfile, template: TemplateDefinition) {
  return {
    projectName: profile.name,
    projectTitle: titleize(profile.name),
    template: template.id,
    templateLabel: template.label
  };
}

export function render(content: string, variables: Record<string, string>) {
  return content.replace(/\{\{(\w+)}}/g, (_match, key: string) => variables[key] ?? "");
}

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
