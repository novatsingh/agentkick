# Version Roadmap

This roadmap turns AgentKick into a usable daily tool without overbuilding.

## v0.1 Current

Status: shipped seed.

Includes:

- `new`
- `init`
- `add`
- `doctor`
- templates
- packs
- basic agent file generation

## v0.2 Foundation

Goal: trust the CLI.

Deliver:

- fixture tests
- snapshot tests
- config schema validation
- write-plan output
- safer error messages
- README cleanup

Release bar:

- generated output is stable
- `npm test` covers core flows

## v0.3 Memory MVP

Goal: make persistent memory real.

Deliver:

- `.agentkick/memory/`
- memory templates
- `agentkick memory validate`
- Doctor memory checks
- Memory Map in `AGENTS.md`

Release bar:

- initialized repos have durable project memory

## v0.4 Doctor V2

Goal: make Doctor the daily readiness engine.

Deliver:

- AI readiness score
- context waste checks
- memory coverage score
- `agentkick analyze`
- `agentkick score`
- `agentkick fix --plan`
- `agentkick fix --safe`

Release bar:

- Doctor output is useful on real repos

## v0.5 Context MVP

Goal: focus agent work.

Deliver:

- context manifest
- budgets
- `agentkick focus`
- default avoid-load rules
- context package output

Release bar:

- common tasks load smaller, clearer context

## v0.6 Task Orchestration MVP

Goal: make work resumable.

Deliver:

- `agentkick prepare-task`
- `agentkick split-task`
- `agentkick continue`
- `agentkick reset-context`
- `agentkick workflow-state`
- task state files

Release bar:

- tasks survive thread reset

## v0.7 Plugin SDK

Goal: extensibility.

Deliver:

- plugin manifest
- plugin validation
- plugin lock file
- local plugin install
- official plugin examples

Release bar:

- external contributors can create packs safely

## v0.8 GitHub Integration

Goal: make AgentKick visible in engineering workflows.

Deliver:

- GitHub Action
- PR comment summary
- readiness badge
- issue templates for Doctor findings
- release checklist generation

Release bar:

- repos can enforce AI readiness in CI

## v0.9 Team Preview

Goal: prepare premium path.

Deliver:

- org policy file
- shared pack config
- Doctor JSON upload format
- local analytics export
- signed plugin design

Release bar:

- SaaS can be built without changing local-first contracts

## v0.10 Multi-Agent Orchestration Preview

Goal: coordinate multiple agents without turning AgentKick into an agent runtime.

Deliver:

- task ownership fields
- handoff packages
- parent/child workflow state
- role-based context packages
- reviewer/test-writer pipeline support
- conflict detection for overlapping scopes

Release bar:

- two agents can work on separate scoped tasks and merge summaries into one parent workflow.

## v1.0

Goal: stable local-first workflow OS.

Deliver:

- stable config schema
- stable memory schema
- stable plugin manifest
- stable Doctor score model
- stable generated file ownership rules
- migration support

Release bar:

- developers can trust AgentKick across production repos
