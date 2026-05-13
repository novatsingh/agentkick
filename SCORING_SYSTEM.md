# Scoring System

AgentKick Doctor scores repository health for AI-assisted development.

Scores must be explainable. Every number should trace to concrete repo signals and clear workflow impact.

## Score Suite

Doctor emits six scores:

```text
AI Readiness Score
Workflow Stability Score
Context Complexity Score
AI Maintainability Score
Token Waste Risk Score
Execution Isolation Score
```

The first, second, third, fourth, and sixth are positive scores where higher is better. Token Waste Risk is a risk score where lower is better.

## Score Bands

Positive scores:

```text
95-100  exceptional
90-94   agent-native
80-89   ready
70-79   usable with friction
60-69   fragile
0-59    high risk
```

Token Waste Risk:

```text
0-19    clean
20-39   watch
40-59   noisy
60-79   expensive
80-100  context fire
```

## Overall AI Readiness Formula

Recommended default weighting:

```text
AI Readiness =
  Workflow Stability      20 percent
  Context Complexity      20 percent
  AI Maintainability      20 percent
  Execution Isolation     20 percent
  Memory Coverage         15 percent
  Safety And Verification  5 percent
```

Token Waste Risk does not directly add to readiness. It applies penalties when severe.

Penalty examples:

- Token Waste Risk above 70: subtract 5.
- Missing `AGENTS.md`: cap readiness at 60.
- Missing verification workflow: cap readiness at 75.
- Missing memory system: cap readiness at 70.
- P0 finding: cap readiness at 69.

Caps keep one critical gap from hiding behind good secondary scores.

## Workflow Stability Score

Base: 100.

Subtract:

```text
-20 missing WORKFLOW_RULES.md
-15 no test command documented
-15 no build command documented for buildable projects
-10 no review workflow
-10 no memory update workflow
-10 no CI or CI explanation
-10 no destructive action policy
-8 workflow commands are vague
-5 scripts exist but are fragmented or duplicated
```

Add small recovery:

```text
+5 pack-specific workflow rules installed
+5 task lifecycle documented
```

Score cannot exceed 100.

## Context Complexity Score

Base: 100.

Subtract:

```text
-25 giant required entry file
-20 oversized React component
-15 memory file over budget
-15 generated/vendor/build paths exposed to default context
-12 feature summaries missing for feature-heavy repo
-12 API contracts missing for API-heavy repo
-10 task scope missing for active work
-10 raw logs in memory files
-8 repeated operating instructions across many files
-5 no context budget file
```

Interpretation:

- 90+ means agents can load small, focused context.
- below 70 means normal tasks likely waste context.
- below 50 means repo shape will drive long-thread degradation.

## AI Maintainability Score

Base: 100.

Subtract:

```text
-20 unclear top-level folder organization
-18 low-cohesion files over threshold
-15 duplicated business logic candidates
-15 excessive cross-feature imports
-12 unclear naming in major modules
-12 architecture memory missing
-10 decisions missing for major architecture changes
-8 tests far from features or not discoverable
-8 massive dependency chains
```

Doctor should classify these as AI maintainability risks, not style violations.

## Token Waste Risk Score

Base: 0.

Add:

```text
+25 giant source file likely needed for common tasks
+20 oversized component with mixed responsibilities
+18 missing feature summaries
+18 missing API contracts
+15 task history over budget
+15 raw logs or transcripts in memory
+12 repeated instructions across agent files
+12 generated output not excluded
+10 no reading priority metadata
+10 stale current task
+8 huge lockfile or generated file referenced in memory
```

Risk should decay when mitigations exist:

```text
-10 feature-scoped memory exists
-10 context manifest exists
-8 context budget exists
-8 large file documented as generated or excluded
-5 task scope file exists
```

Risk floor is 0.

## Execution Isolation Score

Base: 100.

Subtract:

```text
-20 no CURRENT_TASK.md or task manifest for active work
-18 feature work spans many unrelated directories
-15 tests cannot be run narrowly
-15 global state shared across unrelated features
-12 no package or module boundaries
-10 broad scripts with unclear side effects
-10 no ownership map or architecture boundary docs
-8 no verification scope guidance
```

Add:

```text
+5 feature-scoped memory
+5 pack-specific task workflow
+5 targeted test command documented
```

## Memory Coverage Score

Base: 100.

Subtract:

```text
-25 missing AGENTS.md
-20 missing WORKFLOW_RULES.md
-15 missing ARCHITECTURE.md
-15 missing FEATURE_SUMMARIES.md for product repos
-15 missing API_CONTRACTS.md for API repos
-12 missing DECISIONS.md
-12 missing TASK_HISTORY.md after multiple tasks
-10 stale CURRENT_TASK.md
-10 conflicting root and .agentkick memory
-8 memory files over budget
```

Memory Coverage feeds overall readiness and Doctor recommendations.

## Safety And Verification Score

Base: 100.

Subtract:

```text
-25 no verification command
-20 destructive actions not addressed
-15 secrets policy missing
-15 broad MCP/tool access warning
-10 skipped verification not documented in task history
-10 no review expectations
-8 deploy or release workflow missing for deployable repos
```

## Finding Severity

Findings use priority and confidence.

Priority:

```text
P0 blocks reliable AI execution
P1 serious workflow or context risk
P2 meaningful agent friction
P3 improvement opportunity
```

Confidence:

```text
high      direct evidence
medium    strong structural signal
low       heuristic signal requiring review
```

Doctor should not overstate heuristic findings.

## Gates

Recommended default gate:

```text
AI Readiness >= 80
Workflow Stability >= 75
Context Complexity >= 70
AI Maintainability >= 70
Execution Isolation >= 70
Token Waste Risk <= 60
No P0 findings
```

Strict gate:

```text
AI Readiness >= 90
Workflow Stability >= 85
Context Complexity >= 80
AI Maintainability >= 80
Execution Isolation >= 80
Token Waste Risk <= 40
No P0 or unresolved P1 memory findings
```

## JSON Shape

```json
{
  "scores": {
    "aiReadiness": 78,
    "workflowStability": 84,
    "contextComplexity": 61,
    "aiMaintainability": 73,
    "tokenWasteRisk": 68,
    "executionIsolation": 69
  },
  "gate": {
    "status": "failed",
    "reason": "Context Complexity below 70"
  },
  "findings": [],
  "recommendedNextCommand": "agentkick fix --plan"
}
```

## CLI Score Output

```text
AgentKick Score

AI Readiness            78  usable with friction
Workflow Stability      84  ready
Context Complexity      61  fragile
AI Maintainability      73  usable with friction
Token Waste Risk        68  expensive
Execution Isolation     69  fragile

Gate failed
  Context Complexity must be >= 70
  Execution Isolation must be >= 70

Next
  agentkick workflow-report
```

## Score Philosophy

Scores should provoke the right work.

Doctor should not reward surface compliance while the repo remains hard for agents to operate. A complete memory file set is useful only if it is current, compact, and connected to task execution.
