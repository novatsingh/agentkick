# Future SaaS Plan

AgentKick SaaS should extend local-first workflows. It must not replace them.

The local CLI remains the product foundation.

## SaaS Principle

```text
Local-first execution.
Hosted coordination.
```

## What SaaS Adds

- organization policies
- cross-repo Doctor dashboards
- readiness trend history
- private plugin registry
- shared workflow packs
- team memory review
- approval workflows
- MCP permission visibility
- audit exports
- workflow analytics

## What SaaS Must Not Require

- local repo initialization
- memory files
- Doctor checks
- task workflows
- generated agent files
- plugin validation
- basic CI integration

## Premium Upgrade Path

### Free

- CLI
- local Doctor
- local memory
- local packs
- local plugins
- GitHub Action

### Pro

- private repo dashboard
- readiness history
- personal workflow analytics
- saved reports

### Team

- organization policies
- shared packs
- team dashboards
- memory review workflows
- plugin registry

### Enterprise

- SSO
- audit trails
- policy enforcement
- signed plugins
- data residency options
- custom compliance reports

## Workflow Analytics

Useful analytics:

- Doctor score trends
- context waste trend
- missing memory by repo
- stale task count
- readiness gate failures
- most common workflow findings
- plugin drift
- MCP risk inventory
- multi-agent handoff count
- stale workflow state age
- average task context size class

Avoid:

- judging developer productivity by agent output
- invasive keystroke tracking
- storing source code without explicit opt-in

## Multi-Agent Roadmap

Hosted coordination can later help teams see:

- which agent owns a task
- which tasks overlap
- which handoffs are blocked
- which workflows need review
- which memory updates are pending approval

The SaaS layer should coordinate state. It should not require agents to run inside the SaaS.

## GitHub Integration

SaaS should integrate with GitHub:

- install app
- read workflow reports
- post PR comments
- show readiness badge
- track Doctor runs
- open issues for P0/P1 findings

## Enterprise Opportunities

Enterprise value:

- standardize AI coding adoption
- reduce agent permission risk
- enforce workflow memory
- audit AI-assisted development process
- control plugins and MCP usage

## SaaS Risk

Risk:

- product becomes dashboard-first and loses CLI trust.

Mitigation:

- every hosted feature maps to a local file or CLI artifact.
- SaaS never becomes the only source of truth.
