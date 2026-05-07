# Packs

Packs add reusable agent workflows to an existing project.

```bash
agentkick add security
agentkick add netlify
```

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
