# Changelog

## 0.1.0

- Added deeper repo intelligence generation: `.github/instructions/*`, `.claude/skills/*`, `.agents/skills/*`, and `.codex/agents/*`.
- Upgraded `agentkick doctor` into a scored AI-readiness audit with `--strict` and `--json`.
- Added backup preservation when AgentKick updates an existing different file.
- Added `--dry-run` support for write commands.
- Refactored the CLI from a single large executable into focused `src/` modules for commands, templates, packs, profile detection, generated agent files, and doctor checks.
- Added a repo-wide JavaScript syntax checker under `scripts/check.js`.
- Added templates for FastAPI, Flask, Laravel-oriented PHP, Go CLI, Rust CLI, and Electron.
- Added command packs for Python, PHP/Laravel, Go, Rust, and Electron.
- Improved project detection and `doctor` output for non-Node projects.
- Added `agentkick new` for creating AI-agent-ready projects.
- Added `agentkick init` for upgrading existing repos.
- Added `agentkick add` for command and specialist-agent packs.
- Added `agentkick doctor` for readiness checks.
- Added templates for Chrome extension, Next.js, landing page, and Node CLI.
- Added packs for core, Chrome extension, Next.js, Netlify, security, and GitHub.
