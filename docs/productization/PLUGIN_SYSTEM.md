# Plugin System

AgentKick plugins extend workflow infrastructure without bloating core.

Plugins are not arbitrary automation scripts. They are declared workflow contributions with explicit permissions.

## Plugin Goals

- add stack-specific workflows
- add platform packs
- add Doctor checks
- add memory schemas
- add context policies
- add templates
- add agent renderers when needed

## Plugin Manifest

```json
{
  "name": "agentkick-plugin-vercel",
  "version": "0.1.0",
  "agentkick": ">=0.3.0",
  "contributes": {
    "packs": ["vercel"],
    "doctorChecks": ["vercel-build-command"],
    "contextPolicies": ["vercel-output-exclusions"],
    "memoryTemplates": ["deployment"],
    "templates": []
  },
  "permissions": {
    "read": ["package.json", "vercel.json", "docs/**"],
    "write": [".agentkick/**", "WORKFLOW_RULES.md"],
    "commands": []
  }
}
```

## Contribution Points

### Packs

Add commands, skills, rules, memory, and workflow guidance.

### Templates

Add project starters.

### Doctor Checks

Add readiness findings that explain agent workflow impact.

### Context Policies

Add avoid-load rules, budget hints, and task loading rules.

### Memory Schemas

Add domain memory templates.

### Agent Renderers

Add support for new agent-specific files when needed.

## Permission Model

Plugins must declare:

- files they read
- files they write
- commands they suggest
- commands they execute, if any
- generated sections they own

Default:

- read repo metadata
- write only `.agentkick/plugins/<name>/`
- no shell execution

Broader access requires explicit approval.

## Plugin CLI

```bash
agentkick plugin list
agentkick plugin validate ./plugins/vercel
agentkick plugin add ./plugins/vercel
agentkick plugin remove vercel
agentkick plugin inspect vercel
```

## MCP Compatibility Strategy

AgentKick should support MCP by generating safe configuration guidance, not by becoming an MCP host first.

MVP:

- detect broad MCP filesystem access
- warn on unsafe command access
- generate repo-scoped MCP safety notes
- document MCP permissions in `WORKFLOW_RULES.md`

Future:

- plugin contributions for MCP server presets
- team policy for allowed MCP tools
- Doctor checks for MCP drift

Rule:

- MCP should extend workflows, not bypass safety boundaries.

## Official Plugin Candidates

- Vercel
- Render
- Supabase
- Stripe
- GitHub Actions
- Chrome Extension
- Electron
- Next.js
- Laravel
- Python API
- Security
- Accessibility

## Plugin Risk Analysis

High risks:

- plugin writes broad files
- plugin executes shell commands
- plugin hides generated changes
- plugin creates contradictory agent instructions

Controls:

- manifest validation
- dry-run plans
- generated section ownership
- plugin lock file
- Doctor plugin health checks

## Monetization Path

Open source:

- core plugin SDK
- official basic plugins
- local plugin install

Premium:

- private team plugin registry
- signed plugins
- organization policy
- plugin drift dashboard
- enterprise approval workflows
