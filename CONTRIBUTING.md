# Contributing

AgentKick is early. The best contributions are practical templates, command packs, and safety checks that improve AI coding-agent behavior in real repos.

## Local Development

```bash
npm install
npm test
node bin/agentkick.js help
node bin/agentkick.js new chrome-extension sample-extension
```

## Contribution Ideas

- Add a template for a popular stack.
- Add a Claude command or specialist agent pack.
- Improve `doctor` checks for unsafe MCP config, missing scripts, or weak repo instructions.
- Improve generated `AGENTS.md`, `CLAUDE.md`, Cursor rules, or Copilot instructions.

## Code Layout

- Add new template names in `src/constants.js`.
- Add stack profile behavior in `src/profile.js`.
- Add generated project files in `src/templates.js`.
- Add commands and specialist agents in `src/packs.js`.
- Add readiness checks in `src/doctor.js`.
- Keep `bin/agentkick.js` as a thin wrapper only.

## Pull Request Checklist

- Keep changes dependency-light unless the feature clearly needs a package.
- Run `npm test`.
- Include a smoke-test command in the PR description.
- Do not include secrets or personal API keys in examples.
