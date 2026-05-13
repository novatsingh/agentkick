# Viral Features

This document defines what can make AgentKick spread among developers without adding product bloat.

## Viral Feature Rule

A viral feature must be:

- useful locally
- visible in a screenshot
- easy to explain
- connected to real AI workflow pain
- not dependent on cloud infrastructure

## 1. Doctor Score

Feature:

```text
AI readiness: 82/100 usable
```

Why it spreads:

- shareable
- easy to compare
- makes an invisible AI workflow problem visible

Risk:

- fake precision

Guardrail:

- score must always link to concrete findings
- never show score without top reasons

## 2. Context Waste Findings

Feature:

```text
P1 context risk  src/App.tsx is 1,240 lines; agents must load unrelated UI state.
```

Why it spreads:

- developers immediately recognize the pain
- screenshots are self-explanatory
- different from normal linting

Guardrail:

- every finding must explain agent impact

## 3. Before/After Repo Memory

Feature:

Show minimal generated structure:

```text
Before
  no agent rules
  no task memory
  generated files visible

After
  AGENTS.md
  WORKFLOW_RULES.md
  .agentkick/memory/tasks.md
  .agentkick/context/manifest.json
```

Why it spreads:

- makes AgentKick concrete
- shows local-first behavior

Guardrail:

- keep generated diff small

## 4. Paste-Ready Focus Output

Feature:

```text
Read first: AGENTS.md, WORKFLOW_RULES.md
Task files: popup.html, popup.js
Avoid: dist/, node_modules/, release/
Verify: npm test
```

Why it spreads:

- works with every coding agent
- developers can feel the time saved immediately

Guardrail:

- output must stay short
- no proprietary task object required

## 5. Thread Reset Handoff

Feature:

```text
Status: blocked
Result: Trial flow opens but OTP resend still fails.
Verification: npm test passed; manual popup check failed.
Next: inspect server resend cooldown.
```

Why it spreads:

- giant AI chats are a shared pain
- handoff is instantly understandable

Guardrail:

- no raw transcript storage

## 6. Split-Task Output

Feature:

```text
Task: Add paid checkout

1. Add plan config
2. Add checkout API route
3. Wire UI CTA
4. Add verification path
```

Why it spreads:

- turns vague prompts into actionable chunks
- useful before using any AI coding tool

Guardrail:

- no fake dependency graph
- no orchestration claims

## 7. Agent-Ready Badge

Feature:

```text
Agent-ready: yes
AI readiness: 88/100
```

Why it spreads:

- open-source maintainers can show readiness
- simple badge for README

Guardrail:

- badge should be generated from Doctor JSON
- do not require hosted service

## Viral Content Angles

Use:

- "Your AI coding chat is not project memory."
- "Stop explaining your repo to every agent."
- "Find the files wasting your AI context."
- "Make your repo agent-ready in five minutes."
- "A handoff file beats a 90-turn chat."

Avoid:

- attacking AI editors
- retrieval comparisons as enemies
- vague AI platform claims

## Viral Priority

Build in this order:

1. Doctor score and findings.
2. Minimal init before/after.
3. Paste-ready focus output.
4. Summarize handoff.
5. Split-task screenshot.
6. Badge.

## Viral Standard

If a feature cannot be shown in one terminal screenshot, it is not a launch viral feature.
