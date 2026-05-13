# Tech Stack Final

This document locks the implementation stack for AgentKick v1.

## Runtime

Use:

```text
Node.js
```

Reason:

- easiest `npx agentkick` adoption
- natural fit for JS, TS, React, Chrome extension, and frontend-heavy repos
- fast enough for structural filesystem checks
- simple packaging through npm
- works across Windows, macOS, and Linux

## Language

Use:

```text
JavaScript first, TypeScript when the internal shape stabilizes
```

Current priority is shipping a trusted CLI, not migrating the repo for type purity.

TypeScript can be introduced module-by-module after the v1 command contracts are stable.

## Package Model

Ship one npm package:

```text
agentkick
```

Do not split into workspaces for v1.

Internal structure:

```text
bin/
  agentkick.js
src/
  cli/
  config/
  context/
  doctor/
  fs/
  memory/
  output/
  profile/
  tasks/
  templates/
  writers/
scripts/
  check.js
docs/
  final-mvp/
```

## Module Responsibilities

### `src/cli`

- parse arguments
- route commands
- normalize flags
- return exit codes

### `src/config`

- read `.agentkick.json`
- provide defaults
- validate schema

### `src/doctor`

- inspect repo structure
- create findings
- calculate readiness score
- format terminal and JSON output

### `src/context`

- read context manifest
- apply avoid rules
- build focus output
- keep scope explicit

### `src/memory`

- create memory files
- validate memory size and structure
- append task summaries
- detect stale memory

### `src/tasks`

- implement `split-task`
- create lightweight task briefs
- optionally write task files

### `src/fs`

- safe path handling
- backups
- write plans
- managed-section updates
- cross-platform filesystem errors

### `src/output`

- terminal formatting
- JSON formatting
- error formatting
- no noisy banners

### `src/profile`

- detect package manager
- detect stack
- detect commands
- detect generated folders

### `src/writers`

- write scaffold files
- apply managed sections
- preserve existing user content

## Dependencies

Keep dependencies minimal.

Acceptable:

- argument parsing library if already present or very small
- JSON schema validation only if needed
- glob library if native alternatives are insufficient

Avoid:

- heavy AST engines in v1
- database dependencies
- embedding libraries
- watcher daemons
- telemetry SDKs
- cloud clients

## Storage

Use plain files:

```text
.agentkick.json
.agentkick/memory/*.md
.agentkick/context/manifest.json
.agentkick/tasks/*.md
```

No local database in v1.

## Testing

Use the current test path:

```bash
npm.cmd test
```

Minimum coverage:

- command routing
- init dry-run
- init write plan
- safe backups
- Doctor findings
- focus output
- summarize append behavior
- split-task output shape
- Windows path handling

## Release

Release through npm.

Pre-release checks:

```bash
npm.cmd test
npm.cmd pack --dry-run --cache C:\tmp\npm-cache-agentkick
```

## Stack Rule

Choose boring local technology until users prove the need for more.
