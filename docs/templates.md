# Templates

AgentKick templates create a working starter project plus AI-agent workflow memory.

Every template includes:

- `AGENTS.md`
- `CURRENT_TASK.md`
- `ARCHITECTURE.md`
- `FEATURE_SUMMARIES.md`
- `WORKFLOW_RULES.md`
- `DECISIONS.md`
- `TASK_HISTORY.md`
- `.agentkick.json`
- agent instructions for Codex, Claude Code, Cursor, and GitHub Copilot
- modular source folders with feature boundaries

## `chrome-extension`

Creates a Manifest V3 Chrome extension with:

- `manifest.json`
- popup, background, content, and shared message modules
- dependency-free syntax checks
- a real package script that copies extension files into `dist/`
- Chrome-extension-specific workflow pack

```bash
agentkick new chrome-extension browser-helper
```

## `ai-saas`

Creates a Next.js AI SaaS starter with:

- app-router structure
- workflow API route
- workflow service boundary
- memory feature boundary
- environment helper
- Next.js, security, and GitHub workflow packs

```bash
agentkick new ai-saas myapp
```

## `saas`

Creates a Next.js SaaS starter with:

- account boundary
- billing boundary
- workspace boundary
- health API route
- Next.js and GitHub workflow packs

```bash
agentkick new saas dashboard
```

## `marketplace`

Creates a Next.js marketplace starter with:

- vendor boundary
- listing boundary
- order boundary
- admin boundary
- marketplace API route
- Next.js, security, and GitHub workflow packs

```bash
agentkick new marketplace vendorhub
```

## `internal-tool`

Creates a Vite React internal tool starter with:

- dashboard shell
- workflow queue feature
- report boundary
- API client boundary
- GitHub workflow pack

```bash
agentkick new internal-tool ops-console
```

## `electron-app`

Creates an Electron desktop app starter with:

- Electron + React + Vite + TypeScript
- `src/main`, `src/preload`, and `src/renderer` boundaries
- context isolation and no direct Node access in renderer code
- typed preload bridge with a narrow IPC example
- Electron workflow pack

```bash
agentkick new electron-app desktop-studio
```

## `tauri-app`

Creates a Tauri desktop app starter with:

- Tauri + React + Vite + TypeScript
- `src-tauri`, `src/app`, `src/features`, and `src/core` boundaries
- narrow Rust command bridge
- minimal default capability permissions
- Tauri workflow pack

```bash
agentkick new tauri-app native-studio
```

Tauri requires Rust and platform-specific system setup before `npm run dev` or `npm run build`.

## Interactive Mode

```bash
agentkick new
```

Interactive mode opens a project-type selector and then asks for the project name.
