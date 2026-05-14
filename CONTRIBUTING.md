# Contributing

AgentKick is early. The best contributions are practical templates, command packs, and safety checks that improve AI coding-agent behavior in real repos.

## Local Development

```bash
npm install
npm run check
npm run build
npm run smoke
node dist/index.js --help
node dist/index.js new chrome-extension sample-extension --dry-run
```

## Contribution Ideas

- Add a template for a popular stack.
- Add a Claude command or specialist agent pack.
- Improve `doctor` checks for unsafe MCP config, missing scripts, or weak repo instructions.
- Improve generated `AGENTS.md`, `CLAUDE.md`, Cursor rules, or Copilot instructions.

## Code Layout

- CLI entrypoint: `src/index.ts`.
- Command registration: `src/core/program.ts` and `src/commands/*`.
- Stack and capability detection: `src/detectors/*`.
- Generated project templates: `src/templates/*`.
- Workflow memory, focus, summarize, and packs: `src/workflow/*`.
- Doctor readiness checks: `src/doctor/*`.
- Shared terminal, filesystem, git, and formatting helpers: `src/utils/*`.
- Built CLI output: `dist/index.js`.

## Pull Request Checklist

- Keep changes dependency-light unless the feature clearly needs a package.
- Run `npm run check`.
- Run `npm run build`.
- Run `npm run smoke`.
- Include a smoke-test command in the PR description.
- Do not include secrets or personal API keys in examples.
