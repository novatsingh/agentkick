# Packs

Packs add reusable agent workflows to an existing project.

```bash
agentkick add security
agentkick add netlify
```

AgentKick also generates reusable skills and specialist agents during `new` and `init`:

- `.claude/skills/*`
- `.agents/skills/*`
- `.codex/agents/*`
- `.github/instructions/*`

## `core`

Adds baseline Claude commands and a code-review specialist agent:

- `/review`
- `/write-tests`
- `/fix-ci`
- `/explain-codebase`
- `code-reviewer`

## `chrome-extension`

Adds Chrome extension review workflow:

- `/chrome-extension-check`
- `chrome-extension-engineer`

## `nextjs`

Adds Next.js audit workflow:

- `/nextjs-audit`
- `nextjs-engineer`

## `netlify`

Adds deploy debugging support:

- `/debug-netlify-deploy`
- `docs/launch-checklist.md`

## `security`

Adds practical security review support:

- `/security-scan`
- `security-auditor`

## `github`

Adds GitHub launch basics:

- `.github/workflows/agentkick-check.yml`
- `.github/ISSUE_TEMPLATE/bug_report.md`

## `python`

Adds Python API review support:

- `/python-api-check`
- `python-api-engineer`

## `php`

Adds PHP/Laravel review support:

- `/php-laravel-check`
- `laravel-engineer`

## `go`

Adds Go review support:

- `/go-check`
- `go-engineer`

## `rust`

Adds Rust review support:

- `/rust-check`
- `rust-engineer`

## `electron`

Adds Electron desktop review support:

- `/electron-check`
- `electron-engineer`

## `tauri`

Adds Tauri desktop review support:

- `/tauri-check`
- `tauri-engineer`
