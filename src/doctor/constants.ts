export const REQUIRED_AGENT_FILES = [
  ["AGENTS.md", "agent operating rules"],
  ["WORKFLOW_RULES.md", "workflow rules"],
  [".agentkick.json", "AgentKick config"]
] as const;

export const OPTIONAL_AGENT_FILES = [
  ["CLAUDE.md", "Claude memory"],
  [".github/copilot-instructions.md", "Copilot root instructions"],
  [".cursor/rules/agentkick.mdc", "Cursor rules"]
] as const;

export const WORKFLOW_MEMORY_FILES = [
  "AGENTS.md",
  "CURRENT_TASK.md",
  "ARCHITECTURE.md",
  "FEATURE_SUMMARIES.md",
  "WORKFLOW_RULES.md",
  "DECISIONS.md",
  "TASK_HISTORY.md"
] as const;

export const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".py",
  ".go",
  ".rs",
  ".php"
]);

export const SCAN_IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".netlify",
  ".cache",
  "coverage",
  "dist",
  "build",
  "out",
  "node_modules",
  "vendor",
  "target",
  "__pycache__"
]);

export const GENERATED_VENDOR_CANDIDATES = [
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
  "target",
  "vendor",
  "release",
  "storybook-static",
  "public/generated",
  "docs/generated"
];
