# OSS Growth Strategy

This document defines how AgentKick should grow as an open-source developer tool.

## Open-Source Core

Keep open-source:

- CLI
- init scaffold
- Doctor checks
- context manifest
- memory templates
- focus output
- summarize output
- split-task output
- JSON output
- generated file schemas

Reason:

- developers must trust what AgentKick writes
- local workflow value should not require payment
- open-source visibility drives adoption

## Community Contribution Areas

Accept contributions for:

- Doctor checks
- stack detection
- context exclusion presets
- memory templates
- example repos
- docs
- terminal UX improvements
- cross-platform fixes

Avoid early contributions for:

- plugin SDK
- cloud sync
- analytics
- autonomous agents
- semantic indexing
- marketplace systems

## GitHub Star Growth

Primary growth loop:

1. Developer sees Doctor screenshot.
2. Runs `npx agentkick doctor`.
3. Initializes repo with minimal diff.
4. Shares readiness result or context waste finding.
5. Adds AgentKick to another repo.

README should support this loop directly.

## Issues Strategy

Use issue templates:

- Doctor false positive
- Init generated too much
- Focus output too noisy
- Missing stack support
- Windows filesystem issue
- Docs confusion

This turns friction into product data.

## Contribution Standard

Every new feature PR must answer:

- Which v1 workflow step does this improve?
- Does this increase generated repo clutter?
- Does this increase command surface?
- Does this preserve local-first behavior?
- Does this avoid retrieval/indexing scope?

## Premium Opportunities Later

Future paid features may include:

- team readiness dashboards
- GitHub org readiness reports
- PR comments for Doctor findings
- team memory review workflows
- managed policy templates
- private pack governance
- historical readiness trends

Premium must not include:

- basic Doctor
- local init
- local focus
- local summarize
- core memory files

## Enterprise Later

Possible enterprise value:

- standard agent workflow policy across repos
- CI enforcement
- approved memory templates
- GitHub checks
- audit trail for AI-assisted changes
- team-level stale memory reports

Do not build this before local CLI adoption.

## Community Position

AgentKick should be known as:

```text
the repo-native workflow layer for AI-assisted development
```

Not:

- a retrieval engine
- a cloud AI platform
- a coding agent
- a documentation generator

## OSS Growth Rule

Grow trust before growing surface area.
