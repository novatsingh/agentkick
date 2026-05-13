import { json, writeFile } from "../utils/fs.js";
import { readmeFor } from "./agent-files.js";
import type { ProjectProfile, Template } from "../core/types.js";

type TemplateFile = {
  path: string;
  content: string;
};

export type TemplateDefinition = {
  id: Template;
  label: string;
  description: string;
  files: (profile: ProjectProfile) => TemplateFile[];
  nextSteps: string[];
};

const TEMPLATE_REGISTRY: Record<Template, TemplateDefinition> = {
  "ai-saas": {
    id: "ai-saas",
    label: "AI SaaS",
    description: "Next.js product shell with AI workflow, API, and feature boundaries.",
    files: aiSaasFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  "chrome-extension": {
    id: "chrome-extension",
    label: "Chrome Extension",
    description: "Manifest V3 extension with popup, background, content, and shared modules.",
    files: chromeExtensionFiles,
    nextSteps: ["npm install", "npm run package", "agentkick doctor"]
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Next.js marketplace starter with vendor, listing, order, and admin boundaries.",
    files: marketplaceFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Next.js SaaS starter with account, billing, workspace, and API boundaries.",
    files: saasFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  "internal-tool": {
    id: "internal-tool",
    label: "Internal Tool",
    description: "Vite React operations tool with dashboard, workflow, and API-client boundaries.",
    files: internalToolFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  }
};

export function getTemplateDefinition(template: Template) {
  return TEMPLATE_REGISTRY[template];
}

export function templateChoices() {
  return Object.values(TEMPLATE_REGISTRY).map((template) => ({
    name: template.label,
    value: template.id,
    description: template.description
  }));
}

export function writeTemplateProject(projectDir: string, profile: ProjectProfile) {
  const template = getTemplateDefinition(profile.template as Template);
  if (!template) throw new Error(`template writer missing for "${profile.template}"`);

  for (const file of sharedMemoryFiles(profile, template)) {
    writeFile(projectDir, file.path, render(file.content, variablesFor(profile, template)));
  }
  for (const file of template.files(profile)) {
    writeFile(projectDir, file.path, render(file.content, variablesFor(profile, template)));
  }

  writeFile(projectDir, "README.md", readmeFor(profile));
  writeFile(projectDir, ".gitignore", gitignoreFor(profile));
}

export function postInstallStepsFor(template: Template) {
  return getTemplateDefinition(template).nextSteps;
}

function sharedMemoryFiles(profile: ProjectProfile, template: TemplateDefinition): TemplateFile[] {
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
      path: "DECISIONS.md",
      content: `# Decisions

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

function chromeExtensionFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        type: "module",
        scripts: {
          check:
            "node --check src/background/index.js && node --check src/content/index.js && node --check src/popup/index.js && node --check src/shared/messages.js",
          package: "node scripts/package-extension.js",
          test: "npm run check",
          build: "npm run package"
        },
        devDependencies: {}
      })
    },
    {
      path: "manifest.json",
      content: json({
        manifest_version: 3,
        name: "{{projectTitle}}",
        version: "0.1.0",
        description: "AI-native Chrome extension generated by AgentKick.",
        action: { default_popup: "src/popup/index.html" },
        background: { service_worker: "src/background/index.js", type: "module" },
        content_scripts: [{ matches: ["<all_urls>"], js: ["src/content/index.js"], run_at: "document_idle" }],
        permissions: ["storage"]
      })
    },
    {
      path: "src/background/index.js",
      content: `import { MESSAGE_TYPES } from "../shared/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ installedAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== MESSAGE_TYPES.PING) return false;
  sendResponse({ ok: true, scope: "background" });
  return true;
});
`
    },
    {
      path: "src/content/index.js",
      content: `const MESSAGE_TYPE = "agentkick:ping";

chrome.runtime.sendMessage({ type: MESSAGE_TYPE, source: "content" }).catch(() => {
  // The background worker may be unavailable on restricted pages.
});
`
    },
    {
      path: "src/shared/messages.js",
      content: `export const MESSAGE_TYPES = Object.freeze({
  PING: "agentkick:ping"
});
`
    },
    {
      path: "src/popup/index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./styles.css">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <main>
      <section class="panel">
        <p class="eyebrow">Extension</p>
        <h1>{{projectTitle}}</h1>
        <p id="status">Ready</p>
        <button id="check" type="button">Check worker</button>
      </section>
    </main>
    <script type="module" src="./index.js"></script>
  </body>
</html>
`
    },
    {
      path: "src/popup/index.js",
      content: `import { MESSAGE_TYPES } from "../shared/messages.js";

const button = document.querySelector("#check");
const status = document.querySelector("#status");

button?.addEventListener("click", async () => {
  status.textContent = "Checking...";
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.PING, source: "popup" });
    status.textContent = response?.ok ? "Background worker ready." : "No response.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Unable to reach background worker.";
  }
});
`
    },
    {
      path: "src/popup/styles.css",
      content: `:root {
  color-scheme: light;
  --bg: #f7f8fb;
  --ink: #101827;
  --muted: #5d6678;
  --line: #d6deea;
  --accent: #1f5eff;
}

body {
  margin: 0;
  width: 360px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

main {
  padding: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 16px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: 20px;
}

button {
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
}
`
    },
    {
      path: "scripts/package-extension.js",
      content: `import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync("manifest.json", path.join(dist, "manifest.json"));
fs.cpSync("src", path.join(dist, "src"), { recursive: true });
console.log("Extension package prepared in dist/");
`
    },
    {
      path: "src/features/README.md",
      content: `# Extension Features

Keep feature code grouped by browser surface:

- \`background\`: service worker and durable browser events
- \`content\`: page interaction layer
- \`popup\`: user interface
- \`shared\`: message contracts and stable utilities
`
    }
  ];
}

function aiSaasFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    ...nextPackageFiles(profile, "AI SaaS application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the AI workflow layer first.",
      "Design workflows that agents can understand and users can trust."
    ),
    {
      path: "app/api/workflows/route.ts",
      content: `import { NextResponse } from "next/server";
import { listWorkflowRuns } from "@/src/features/workflows/server/workflow-service";

export async function GET() {
  return NextResponse.json({ workflows: listWorkflowRuns() });
}
`
    },
    {
      path: "src/features/workflows/server/workflow-service.ts",
      content: `export type WorkflowRun = {
  id: string;
  name: string;
  status: "queued" | "running" | "complete";
};

const runs: WorkflowRun[] = [
  { id: "demo-onboarding", name: "Onboarding analysis", status: "queued" }
];

export function listWorkflowRuns() {
  return runs;
}
`
    },
    {
      path: "src/features/workflows/README.md",
      content: `# Workflows

Owns AI workflow runs, execution state, and task handoff boundaries.

Agents should keep prompt, execution, and result handling separate in this feature.
`
    },
    {
      path: "src/features/memory/README.md",
      content: `# Memory

Owns durable project and customer-facing memory. Do not store secrets here.

Use small typed records and summarize long-running state before it enters prompts.
`
    },
    {
      path: "src/core/env.ts",
      content: `export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing required environment variable: \${name}\`);
  return value;
}
`
    }
  ];
}

function saasFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    ...nextPackageFiles(profile, "SaaS application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the smallest useful customer workspace.",
      "Keep account, billing, and workspace boundaries explicit."
    ),
    {
      path: "src/features/accounts/README.md",
      content: `# Accounts

Owns user, organization, and membership behavior.

Do not mix billing or product workflow behavior into this module.
`
    },
    {
      path: "src/features/billing/README.md",
      content: `# Billing

Owns plans, subscriptions, invoices, and payment-provider boundaries.

Agents must call out migration impact before changing billing contracts.
`
    },
    {
      path: "src/features/workspaces/README.md",
      content: `# Workspaces

Owns the customer workspace shell and scoped project data.
`
    },
    {
      path: "app/api/health/route.ts",
      content: `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "{{projectName}}" });
}
`
    }
  ];
}

function marketplaceFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    ...nextPackageFiles(profile, "Marketplace application generated by AgentKick."),
    ...nextBaseFiles(
      "Build the marketplace trust loop first.",
      "Keep vendor, listing, order, and admin modules isolated."
    ),
    {
      path: "src/features/vendors/README.md",
      content: `# Vendors

Owns seller onboarding, profiles, approval state, and vendor operations.
`
    },
    {
      path: "src/features/listings/README.md",
      content: `# Listings

Owns catalog items, availability, pricing display, and listing quality checks.
`
    },
    {
      path: "src/features/orders/README.md",
      content: `# Orders

Owns checkout handoff, order lifecycle, fulfillment state, and customer updates.
`
    },
    {
      path: "src/features/admin/README.md",
      content: `# Admin

Owns marketplace moderation, trust operations, and support workflows.
`
    },
    {
      path: "app/api/marketplace/route.ts",
      content: `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    vendors: [],
    listings: [],
    orders: []
  });
}
`
    }
  ];
}

function internalToolFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "tsc --noEmit && vite build", preview: "vite preview", test: "npm run build" },
        dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest" },
        devDependencies: {
          typescript: "latest",
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest"
        }
      })
    },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
`
    },
    {
      path: "src/app/main.tsx",
      content: `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: "src/app/App.tsx",
      content: `import { WorkflowQueue } from "../features/workflows/WorkflowQueue";

export function App() {
  return (
    <main className="shell">
      <section>
        <p className="eyebrow">Internal Tool</p>
        <h1>{{projectTitle}}</h1>
        <p>Operate repeatable workflows with clear ownership and agent-readable task boundaries.</p>
      </section>
      <WorkflowQueue />
    </main>
  );
}
`
    },
    {
      path: "src/app/styles.css",
      content: `:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --ink: #101827;
  --muted: #5c6678;
  --line: #d9e0ea;
  --accent: #0f766e;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  width: min(1040px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0;
  display: grid;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(34px, 6vw, 64px);
  line-height: 1;
}

.queue {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 20px;
}
`
    },
    {
      path: "src/features/workflows/WorkflowQueue.tsx",
      content: `const tasks = [
  { id: "ops-review", title: "Review blocked workflows", owner: "operations" },
  { id: "customer-sync", title: "Sync customer updates", owner: "support" }
];

export function WorkflowQueue() {
  return (
    <section className="queue" aria-label="Workflow queue">
      <h2>Workflow queue</h2>
      {tasks.map((task) => (
        <article key={task.id}>
          <strong>{task.title}</strong>
          <p>Owner: {task.owner}</p>
        </article>
      ))}
    </section>
  );
}
`
    },
    {
      path: "src/core/api-client.ts",
      content: `export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json() as Promise<T>;
}
`
    },
    {
      path: "src/features/reports/README.md",
      content: `# Reports

Owns operational reporting, exports, and dashboard metrics.
`
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: "ESNext",
          moduleResolution: "Node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx"
        },
        include: ["src"],
        references: []
      })
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
`
    }
  ];
}

function nextPackageFiles(profile: ProjectProfile, description: string): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        description,
        scripts: { dev: "next dev", build: "next build", start: "next start", test: "npm run build" },
        dependencies: { next: "latest", react: "latest", "react-dom": "latest" },
        devDependencies: {
          typescript: "latest",
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest"
        }
      })
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          paths: { "@/*": ["./*"] }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      })
    },
    { path: "next.config.mjs", content: "const nextConfig = {};\nexport default nextConfig;\n" }
  ];
}

function nextBaseFiles(headline: string, subheadline: string): TemplateFile[] {
  return [
    {
      path: "app/layout.tsx",
      content: `import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
    },
    {
      path: "app/page.tsx",
      content: `export default function Home() {
  return (
    <main className="shell">
      <section>
        <p className="eyebrow">AgentKick Project</p>
        <h1>${headline}</h1>
        <p>${subheadline}</p>
      </section>
    </main>
  );
}
`
    },
    {
      path: "app/globals.css",
      content: `:root {
  color-scheme: light;
  --bg: #f7f8fb;
  --ink: #111827;
  --muted: #5d6678;
  --accent: #1f5eff;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  min-height: 100vh;
  width: min(960px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  align-content: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0 0 18px;
  font-size: clamp(40px, 8vw, 84px);
  line-height: 0.98;
}

p {
  max-width: 680px;
  font-size: 20px;
  line-height: 1.6;
}
`
    },
    {
      path: "src/core/README.md",
      content: `# Core

Shared framework-neutral code lives here. Keep this folder small and stable.
`
    },
    {
      path: "src/shared/README.md",
      content: `# Shared

Reusable utilities and presentational pieces that do not own product behavior.
`
    }
  ];
}

function gitignoreFor(profile: ProjectProfile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/", "*.agentkick-backup"];
  const stackItems: string[] = ["node_modules/"];
  if (profile.stack.includes("nextjs")) stackItems.push(".next/", "out/");
  if (profile.stack.includes("vite")) stackItems.push(".vite/");
  return `${[...new Set([...common, ...stackItems])].join("\n")}\n`;
}

function variablesFor(profile: ProjectProfile, template: TemplateDefinition) {
  return {
    projectName: profile.name,
    projectTitle: titleize(profile.name),
    template: template.id,
    templateLabel: template.label
  };
}

function render(content: string, variables: Record<string, string>) {
  return content.replace(/\{\{(\w+)}}/g, (_match, key: string) => variables[key] ?? "");
}

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
