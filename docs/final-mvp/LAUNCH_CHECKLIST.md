# Launch Checklist

This checklist defines what must be true before AgentKick v1 is launched publicly.

## Product Lock

- [ ] v1 command set is limited to `init`, `doctor`, `focus`, `summarize`, and `split-task`.
- [ ] README does not position AgentKick as retrieval, search, or code intelligence.
- [ ] README explains local-first behavior.
- [ ] README shows generated files.
- [ ] README shows realistic Doctor output.

## CLI Quality

- [ ] `agentkick init` supports dry-run.
- [ ] `agentkick init` creates the minimal scaffold.
- [ ] `agentkick init` does not edit app source files.
- [ ] `agentkick doctor` works before init.
- [ ] `agentkick doctor --json` has stable output.
- [ ] `agentkick doctor --strict` returns useful exit codes.
- [ ] `agentkick focus --files` works without task setup.
- [ ] `agentkick summarize --task` appends compact memory.
- [ ] `agentkick split-task` outputs scoped subtasks.

## Safety

- [ ] write commands show exact file list.
- [ ] backups are created before overwrites.
- [ ] managed sections preserve user content.
- [ ] filesystem errors say whether files changed.
- [ ] no command deletes user files.
- [ ] no command auto-refactors app source.

## Verification

- [ ] `npm.cmd test` passes on Windows.
- [ ] `npm test` passes on non-Windows environments.
- [ ] package dry-run succeeds.
- [ ] CLI works through `npx`.
- [ ] generated files are included in package.
- [ ] docs are included in package or linked from README.

## Demo Assets

- [ ] terminal transcript for first run.
- [ ] before/after generated file tree.
- [ ] Doctor score screenshot or text block.
- [ ] focus output example.
- [ ] summarize output example.
- [ ] messy repo case study.

## GitHub

- [ ] repo root is clean.
- [ ] docs index is current.
- [ ] issues enabled.
- [ ] contribution guide exists.
- [ ] license exists.
- [ ] release tag created.
- [ ] npm package version matches release.

## Launch Channels

- [ ] GitHub README.
- [ ] X/Twitter thread.
- [ ] Hacker News Show HN draft.
- [ ] Reddit developer communities only where appropriate.
- [ ] Cursor/Codex/Claude Code community posts.
- [ ] short demo video or GIF.

## Launch Message

Core message:

```text
Your AI coding chat is not project memory.
AgentKick makes your repo carry the workflow context agents need.
```

Avoid:

- "autonomous"
- "semantic"
- "vector"
- "AI brain"
- "replaces your coding agent"

## Launch Gate

Do not launch if:

- init creates a confusing diff
- Doctor output is generic
- focus output is too long to paste
- summarize stores raw logs
- README reads like a SaaS platform pitch

Launch only when the local CLI loop feels sharp.
