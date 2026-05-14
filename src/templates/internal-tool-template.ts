import type { ProjectProfile } from "../core/types.js";
import { json } from "../utils/fs.js";
import type { TemplateFile } from "./template-types.js";

export function internalToolFiles(profile: ProjectProfile): TemplateFile[] {
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
