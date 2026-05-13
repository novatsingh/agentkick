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
  },
  "electron-app": {
    id: "electron-app",
    label: "Electron App",
    description: "Electron desktop app with React, Vite, preload bridge, and IPC boundaries.",
    files: electronAppFiles,
    nextSteps: ["npm install", "npm run dev", "agentkick doctor"]
  },
  "tauri-app": {
    id: "tauri-app",
    label: "Tauri App",
    description: "Tauri desktop app with React, Vite, Rust commands, and minimal capabilities.",
    files: tauriAppFiles,
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

function electronAppFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        main: "dist/main/index.js",
        scripts: {
          dev: "electron-vite dev",
          build: "tsc --noEmit && electron-vite build",
          package: "npm run build && electron-builder --dir",
          test: "npm run build"
        },
        dependencies: {
          electron: "^39.2.7",
          "electron-vite": "^5.0.0",
          react: "^19.2.3",
          "react-dom": "^19.2.3"
        },
        devDependencies: {
          "@types/node": "latest",
          "@types/react": "^19.2.7",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^5.1.2",
          "electron-builder": "^26.0.12",
          typescript: "^5.9.3",
          vite: "^7.3.0"
        },
        build: {
          appId: `com.agentkick.${profile.name.replace(/[^a-z0-9]/g, "") || "desktop"}`,
          productName: "{{projectTitle}}",
          directories: { output: "release" },
          files: ["dist/**"]
        }
      })
    },
    {
      path: "electron.vite.config.ts",
      content: `import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts")
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts")
        }
      }
    }
  },
  renderer: {
    root: "src/renderer",
    plugins: [react()]
  }
});
`
    },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          target: "ES2022",
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          isolatedModules: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["node"]
        },
        include: ["electron.vite.config.ts", "src/**/*.ts", "src/**/*.tsx"]
      })
    },
    {
      path: "src/main/index.ts",
      content: `import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 560,
    title: "{{projectTitle}}",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("app:version", () => app.getVersion());

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`
    },
    {
      path: "src/preload/index.ts",
      content: `import { contextBridge, ipcRenderer } from "electron";

const desktop = {
  getVersion: () => ipcRenderer.invoke("app:version") as Promise<string>
};

contextBridge.exposeInMainWorld("desktop", desktop);

export type DesktopBridge = typeof desktop;
`
    },
    {
      path: "src/renderer/src/vite-env.d.ts",
      content: `/// <reference types="vite/client" />

import type { DesktopBridge } from "../../preload";

declare global {
  interface Window {
    desktop: DesktopBridge;
  }
}
`
    },
    {
      path: "src/renderer/index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectTitle}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/App.tsx"></script>
  </body>
</html>
`
    },
    {
      path: "src/renderer/src/App.tsx",
      content: `import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [version, setVersion] = useState("loading");

  useEffect(() => {
    void window.desktop.getVersion().then(setVersion);
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Electron Desktop</p>
        <h1>{{projectTitle}}</h1>
        <p>Build desktop workflows with strict main, preload, and renderer boundaries.</p>
      </section>
      <section className="panel" aria-label="Desktop status">
        <span>App version</span>
        <strong>{version}</strong>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
`
    },
    {
      path: "src/renderer/src/styles.css",
      content: desktopStyles("Electron")
    },
    {
      path: "src/features/desktop-shell/README.md",
      content: `# Desktop Shell

Owns the desktop window, IPC bridge, and renderer shell.

Agent rules:

- Keep Electron main-process code in \`src/main\`.
- Keep preload bridge code in \`src/preload\`.
- Keep UI code in \`src/renderer\`.
- Add IPC channels intentionally and document why renderer code needs each one.
`
    }
  ];
}

function tauriAppFiles(profile: ProjectProfile): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: json({
        name: profile.name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "tauri dev",
          "web:dev": "vite --host 127.0.0.1 --port 1420",
          "web:build": "npm run typecheck && vite build",
          build: "tauri build",
          typecheck: "tsc --noEmit",
          test: "npm run typecheck"
        },
        dependencies: {
          "@tauri-apps/api": "latest",
          react: "^19.2.3",
          "react-dom": "^19.2.3"
        },
        devDependencies: {
          "@tauri-apps/cli": "latest",
          "@types/node": "latest",
          "@types/react": "^19.2.7",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^5.1.2",
          typescript: "^5.9.3",
          vite: "^7.3.0"
        }
      })
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    strictPort: true
  },
  envPrefix: ["VITE_", "TAURI_"]
});
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
      content: `import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function App() {
  const [message, setMessage] = useState("Ready");

  async function checkNativeBridge() {
    const response = await invoke<string>("desktop_status", { name: "{{projectTitle}}" });
    setMessage(response);
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Tauri Desktop</p>
        <h1>{{projectTitle}}</h1>
        <p>Build native desktop workflows with narrow Rust commands and minimal permissions.</p>
      </section>
      <section className="panel" aria-label="Native bridge status">
        <span>Native bridge</span>
        <strong>{message}</strong>
        <button type="button" onClick={checkNativeBridge}>
          Check bridge
        </button>
      </section>
    </main>
  );
}
`
    },
    {
      path: "src/app/styles.css",
      content: desktopStyles("Tauri")
    },
    {
      path: "src/features/desktop-shell/README.md",
      content: `# Desktop Shell

Owns the Tauri window, native command bridge, and renderer shell.

Agent rules:

- Keep native commands narrow and typed in \`src-tauri/src\`.
- Keep UI behavior in \`src/app\` or feature folders.
- Keep capabilities minimal and review permission changes carefully.
- Do not add broad filesystem, shell, or network permissions without documenting the user-facing need.
`
    },
    {
      path: "src/core/native.ts",
      content: `import { invoke } from "@tauri-apps/api/core";

export function desktopStatus(name: string) {
  return invoke<string>("desktop_status", { name });
}
`
    },
    {
      path: "src-tauri/Cargo.toml",
      content: `[package]
name = "{{projectName}}"
version = "0.1.0"
description = "Desktop app generated by AgentKick"
authors = ["you"]
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`
    },
    {
      path: "src-tauri/build.rs",
      content: `fn main() {
  tauri_build::build()
}
`
    },
    {
      path: "src-tauri/tauri.conf.json",
      content: json({
        $schema: "https://schema.tauri.app/config/2",
        productName: "{{projectTitle}}",
        version: "0.1.0",
        identifier: `com.agentkick.${profile.name.replace(/[^a-z0-9]/g, "") || "desktop"}`,
        build: {
          beforeDevCommand: "npm run web:dev",
          beforeBuildCommand: "npm run web:build",
          devUrl: "http://127.0.0.1:1420",
          frontendDist: "../dist"
        },
        app: {
          windows: [
            {
              title: "{{projectTitle}}",
              width: 1120,
              height: 760,
              minWidth: 860,
              minHeight: 560
            }
          ],
          security: {
            csp: null
          }
        },
        bundle: {
          active: true,
          targets: "all"
        }
      })
    },
    {
      path: "src-tauri/src/main.rs",
      content: `#[tauri::command]
fn desktop_status(name: &str) -> String {
    format!("{name} native bridge ready")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
`
    },
    {
      path: "src-tauri/capabilities/default.json",
      content: json({
        identifier: "default",
        description: "Default desktop capability with no broad filesystem or shell permissions.",
        windows: ["main"],
        permissions: ["core:default"]
      })
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

function desktopStyles(stackName: string) {
  return `:root {
  color-scheme: light;
  --bg: #f5f7fb;
  --ink: #101827;
  --muted: #5c6678;
  --line: #d8e0eb;
  --accent: #1f5eff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 760px;
  min-height: 520px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.shell {
  min-height: 100vh;
  width: min(1040px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  align-content: center;
  gap: 24px;
}

.hero {
  display: grid;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0;
  font-size: 56px;
  line-height: 1;
}

p {
  max-width: 660px;
  margin: 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.6;
}

.panel {
  width: min(480px, 100%);
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 18px;
}

.panel span {
  color: var(--muted);
  font-size: 13px;
}

.panel strong {
  font-size: 18px;
}

button {
  width: fit-content;
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 820px) {
  body {
    min-width: 0;
  }

  .shell {
    width: min(100% - 32px, 1040px);
  }

  h1 {
    font-size: 40px;
  }
}

/* ${stackName} template: keep native bridge code outside the UI surface. */
`;
}

function gitignoreFor(profile: ProjectProfile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/", "*.agentkick-backup"];
  const stackItems: string[] = ["node_modules/"];
  if (profile.stack.includes("nextjs")) stackItems.push(".next/", "out/");
  if (profile.stack.includes("vite")) stackItems.push(".vite/");
  if (profile.stack.includes("electron")) stackItems.push("release/");
  if (profile.stack.includes("tauri")) stackItems.push("src-tauri/target/");
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
