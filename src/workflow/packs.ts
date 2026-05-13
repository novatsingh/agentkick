import path from "node:path";
import { launchChecklist } from "../templates/agent-files.js";
import { json, readJsonSafe, writeAbsoluteFile, writeFile } from "../utils/fs.js";
import type { Pack, ProjectProfile, WritePackOptions } from "../core/types.js";

type PackEntry =
  | { kind: "command"; name: string; body: string }
  | { kind: "agent"; name: string; description: string; body: string }
  | { kind: "file"; path: string; content: string };

type PackWriter = (profile: ProjectProfile) => PackEntry[];

const PACKS: Record<Pack, PackWriter> = {
  core(profile: ProjectProfile) {
    return [
      command(
        "review",
        "Review the current changes like a senior engineer. Prioritize bugs, regressions, missing tests, security risks, and unclear behavior. Use file and line references where possible."
      ),
      command(
        "write-tests",
        `Add or update tests for the current change. Use this project's documented test command: ${profile.testCommand}. If no test harness exists, explain the smallest practical test setup before adding dependencies.`
      ),
      command(
        "fix-ci",
        "Inspect the failing CI or local command output, identify the smallest root-cause fix, apply it, and rerun the relevant verification command."
      ),
      command(
        "explain-codebase",
        "Explain this codebase for a new maintainer. Cover entry points, important directories, commands, deploy path, and risk areas."
      ),
      agent(
        "code-reviewer",
        "Use this agent for code review, PR review, regression analysis, and quality checks.",
        "You are a strict code reviewer. Findings come first. Focus on behavioral bugs, regressions, missing tests, security issues, and deploy risks. Do not summarize unless findings are complete."
      )
    ];
  },
  "chrome-extension": () => [
    command(
      "chrome-extension-check",
      "Review the Chrome extension for manifest issues, popup sizing, service worker lifecycle bugs, unsafe permissions, content-script mistakes, and packaging readiness."
    ),
    agent(
      "chrome-extension-engineer",
      "Use this agent for Chrome extension popup, background service worker, manifest, content script, and Web Store packaging work.",
      "You are a Chrome extension engineer. Preserve least-privilege permissions, verify popup viewport behavior, avoid exposing secrets, and check manifest v3 service worker constraints."
    )
  ],
  nextjs: () => [
    command(
      "nextjs-audit",
      "Audit the Next.js app for routing, server/client component boundaries, accessibility, metadata, bundle risks, and build failures."
    ),
    agent(
      "nextjs-engineer",
      "Use this agent for Next.js app router, React UI, data loading, and deployment issues.",
      "You are a Next.js engineer. Respect existing component patterns, keep server/client boundaries clear, and run type/build checks after changes."
    )
  ],
  netlify: (profile: ProjectProfile) => [
    command(
      "debug-netlify-deploy",
      "Debug the Netlify deploy path. Check netlify.toml, publish directory, build command, environment variables, redirects, and whether the deploy ran from the correct working directory."
    ),
    file("docs/launch-checklist.md", launchChecklist(profile))
  ],
  security: () => [
    command(
      "security-scan",
      "Perform a practical security review. Focus on secrets, auth bypass, injection, dependency risks, unsafe MCP config, exposed admin surfaces, and user-data handling."
    ),
    agent(
      "security-auditor",
      "Use this agent for security review and threat modeling.",
      "You are a security auditor. Validate exploitability before escalating severity. Prefer concrete attack paths and precise remediation."
    )
  ],
  python: () => [
    command(
      "python-api-check",
      "Review the Python API for dependency hygiene, route behavior, validation, error handling, test coverage, and production server readiness."
    ),
    agent(
      "python-api-engineer",
      "Use this agent for FastAPI, Flask, Python packaging, pytest, and API deployment work.",
      "You are a Python API engineer. Keep dependencies minimal, prefer pytest for verification, validate request/response behavior, and avoid leaking secrets through logs or config."
    )
  ],
  php: () => [
    command(
      "php-laravel-check",
      "Review the PHP/Laravel app for routing, validation, migrations, auth, config caching, queue behavior, and test coverage."
    ),
    agent(
      "laravel-engineer",
      "Use this agent for Laravel, Composer, Artisan, routing, migrations, and PHP test workflows.",
      "You are a Laravel engineer. Preserve framework conventions, avoid editing generated vendor files, check migrations carefully, and verify with php artisan test when available."
    )
  ],
  go: () => [
    command(
      "go-check",
      "Review the Go project for package layout, error handling, concurrency risks, CLI behavior, test coverage, and release readiness."
    ),
    agent(
      "go-engineer",
      "Use this agent for Go CLI, API, module, testing, and release work.",
      "You are a Go engineer. Keep APIs small, return explicit errors, prefer table-driven tests, and verify with go test ./... before shipping."
    )
  ],
  rust: () => [
    command(
      "rust-check",
      "Review the Rust project for ownership issues, error handling, CLI behavior, unsafe code, tests, and release readiness."
    ),
    agent(
      "rust-engineer",
      "Use this agent for Rust CLI, crates, tests, and release work.",
      "You are a Rust engineer. Avoid unsafe code unless justified, prefer clear Result-based errors, keep dependencies lean, and verify with cargo test."
    )
  ],
  electron: () => [
    command(
      "electron-check",
      "Review the Electron app for main/preload/renderer boundaries, context isolation, IPC safety, packaging, auto-update risks, and desktop UX."
    ),
    agent(
      "electron-engineer",
      "Use this agent for Electron desktop apps, preload scripts, IPC, renderer UI, and packaging work.",
      "You are an Electron engineer. Keep Node access out of the renderer, use preload boundaries carefully, avoid broad IPC channels, and verify syntax before packaging."
    )
  ],
  tauri: () => [
    command(
      "tauri-check",
      "Review the Tauri app for Rust command boundaries, capability permissions, frontend/native bridge safety, packaging setup, and desktop UX."
    ),
    agent(
      "tauri-engineer",
      "Use this agent for Tauri desktop apps, Rust commands, capability permissions, frontend integration, and packaging work.",
      "You are a Tauri engineer. Keep permissions minimal, expose narrow commands, avoid broad filesystem access, and verify both TypeScript and Rust boundaries before packaging."
    )
  ],
  github: () => [
    file(
      ".github/workflows/agentkick-check.yml",
      "name: AgentKick Check\n\non:\n  pull_request:\n  push:\n    branches: [main]\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm install\n      - run: npm test\n"
    ),
    file(
      ".github/ISSUE_TEMPLATE/bug_report.md",
      "---\nname: Bug report\nabout: Report a reproducible problem\n---\n\n## Problem\n\n## Steps to reproduce\n\n## Expected behavior\n\n## Logs or screenshots\n"
    )
  ]
};

export function writePack(cwd: string, pack: string, profile: ProjectProfile, options: WritePackOptions = {}) {
  if (!isPack(pack)) throw new Error(`pack writer missing for "${pack}"`);
  const entries = PACKS[pack]?.(profile);
  if (!entries) throw new Error(`pack writer missing for "${pack}"`);

  for (const entry of entries) {
    if (entry.kind === "command") writeClaudeCommand(cwd, entry.name, entry.body);
    if (entry.kind === "agent") writeClaudeAgent(cwd, entry.name, entry.description, entry.body);
    if (entry.kind === "file") writeFile(cwd, entry.path, entry.content);
  }

  if (options.updateConfig !== false) updateAgentkickConfig(cwd, { addedPacks: [pack] });
}

function command(name: string, body: string): PackEntry {
  return { kind: "command", name, body };
}

function agent(name: string, description: string, body: string): PackEntry {
  return { kind: "agent", name, description, body };
}

function file(filePath: string, content: string): PackEntry {
  return { kind: "file", path: filePath, content };
}

function writeClaudeCommand(cwd: string, name: string, body: string) {
  writeFile(cwd, `.claude/commands/${name}.md`, `---\ndescription: ${name.replace(/-/g, " ")}\n---\n\n${body}\n`);
}

function writeClaudeAgent(cwd: string, name: string, description: string, body: string) {
  writeFile(cwd, `.claude/agents/${name}.md`, `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n`);
}

function updateAgentkickConfig(cwd: string, patch: { addedPacks?: string[] }) {
  const filePath = path.join(cwd, ".agentkick.json");
  const current = readJsonSafe<{ packs?: string[] }>(filePath) ?? {};
  const packs = new Set([...(current.packs ?? []), ...(patch.addedPacks ?? [])]);
  current.packs = [...packs].sort();
  writeAbsoluteFile(filePath, json(current));
}

function isPack(value: string): value is Pack {
  return Object.prototype.hasOwnProperty.call(PACKS, value);
}
