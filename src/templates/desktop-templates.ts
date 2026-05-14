import type { ProjectProfile } from "../core/types.js";
import { json } from "../utils/fs.js";
import type { TemplateFile } from "./template-types.js";

export function electronAppFiles(profile: ProjectProfile): TemplateFile[] {
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

export function tauriAppFiles(profile: ProjectProfile): TemplateFile[] {
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
