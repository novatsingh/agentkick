import fs from "node:fs";
import path from "node:path";
import { readJsonSafe } from "./fs-utils.js";
import { detectProject } from "./profile.js";
import type { DetectionDebug, DoctorOptions, PackageJson } from "./types.js";

type DoctorCheck = { ok: boolean; label: string; message: string };

type AgentkickConfig = {
  testCommand?: string;
  buildCommand?: string;
};

type DoctorAudit = {
  score: number;
  status: "ready" | "blocked" | "needs-review";
  detectedStack: string;
  detectedCapabilities: string[];
  detectionDebug: DetectionDebug;
  checks: DoctorCheck[];
  warnings: string[];
  failures: string[];
  suggestions: string[];
};

export function runDoctor(cwd: string, options: DoctorOptions = {}) {
  const audit = auditRepo(cwd);
  if (options.json) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    printAudit(audit, options);
  }
  if (options.strict && (audit.failures.length > 0 || audit.score < 85)) {
    process.exitCode = 1;
  }
}

function auditRepo(cwd: string): DoctorAudit {
  const packageInfo = readJsonSafe<PackageJson>(path.join(cwd, "package.json"));
  const config = readJsonSafe<AgentkickConfig>(path.join(cwd, ".agentkick.json"));
  const profile = detectProject(cwd);
  const checks = [
    requiredFile(cwd, "AGENTS.md", "master repo intelligence"),
    requiredFile(cwd, "CLAUDE.md", "Claude memory"),
    requiredFile(cwd, ".github/copilot-instructions.md", "Copilot root instructions"),
    requiredFile(cwd, ".github/instructions/security.instructions.md", "Copilot security instructions"),
    requiredFile(cwd, ".claude/skills/review/SKILL.md", "Claude review skill"),
    requiredFile(cwd, ".claude/skills/security-scan/SKILL.md", "Claude security skill"),
    requiredFile(cwd, ".agents/skills/review/SKILL.md", "generic review skill"),
    requiredFile(cwd, ".codex/agents/reviewer.md", "Codex reviewer agent"),
    requiredFile(cwd, ".cursor/rules/agentkick.mdc", "Cursor rules"),
    requiredFile(cwd, ".agentkick.json", "AgentKick config")
  ];
  const warnings = [
    ...qualityWarnings(cwd),
    ...commandWarnings(packageInfo, config),
    ...findRiskyMcp(cwd),
    ...ciWarnings(cwd)
  ];
  const failures = checks.filter((check) => !check.ok).map((check) => check.message);
  const score = Math.max(0, 100 - failures.length * 10 - warnings.length * 4);

  return {
    score,
    status: failures.length === 0 && score >= 85 ? "ready" : failures.length > 0 ? "blocked" : "needs-review",
    detectedStack: profile.primaryStack ?? profile.template,
    detectedCapabilities: profile.capabilities ?? [],
    detectionDebug: profile.detection ?? {
      cwd,
      primaryStack: profile.primaryStack ?? profile.template,
      capabilities: profile.capabilities ?? [],
      detected: profile.stack,
      filesChecked: [],
      dependencies: [],
      configFiles: [],
      reasoning: []
    },
    checks,
    warnings,
    failures,
    suggestions: suggestionsFor(failures, warnings)
  };
}

function printAudit(audit: DoctorAudit, options: DoctorOptions) {
  console.log("AgentKick doctor");
  console.log("");
  console.log(`Detected stack: ${audit.detectedStack}`);
  if (audit.detectedCapabilities.length > 0)
    console.log(`Detected capabilities: ${audit.detectedCapabilities.join(", ")}`);
  if (audit.detectedStack === "generic") {
    console.log("Could not confidently detect stack. Run agentkick doctor --debug to see checked files.");
  }
  console.log("");
  console.log(`AI-readiness score: ${audit.score}/100`);
  console.log(`Status: ${audit.status}`);
  if (options.strict) console.log("Mode: strict");
  console.log("");

  for (const check of audit.checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}: ${check.message}`);
  }

  for (const warning of audit.warnings) {
    console.log(`WARN ${warning}`);
  }

  if (audit.suggestions.length > 0) {
    console.log("");
    console.log("Suggested fixes:");
    for (const suggestion of audit.suggestions) console.log(`- ${suggestion}`);
  }

  if (options.debug) printDetectionDebug(audit.detectionDebug);
}

function requiredFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

function qualityWarnings(cwd: string) {
  const warnings: string[] = [];
  const agents = readFileSafe(path.join(cwd, "AGENTS.md"));
  if (agents && !agents.includes("Forbidden")) warnings.push("AGENTS.md should define forbidden modifications.");
  if (agents && !agents.includes("Test:")) warnings.push("AGENTS.md should document test commands.");
  if (agents && !agents.includes("Build:")) warnings.push("AGENTS.md should document build commands.");
  const claude = readFileSafe(path.join(cwd, "CLAUDE.md"));
  if (claude && claude.split(/\r?\n/).length > 200) warnings.push("CLAUDE.md should stay under 200 lines.");
  return warnings;
}

function commandWarnings(packageInfo: PackageJson | null, config: AgentkickConfig | null) {
  const warnings: string[] = [];
  if (packageInfo?.scripts) {
    if (!packageInfo.scripts.test && (!config?.testCommand || config.testCommand.startsWith("document ")))
      warnings.push("No test command documented.");
    if (!packageInfo.scripts.build && (!config?.buildCommand || config.buildCommand.startsWith("document ")))
      warnings.push("No build command documented.");
  } else if (!config?.testCommand || config.testCommand.startsWith("document ")) {
    warnings.push("No package scripts or documented test command detected.");
  }
  return warnings;
}

function ciWarnings(cwd: string) {
  const workflowDir = path.join(cwd, ".github", "workflows");
  if (!fs.existsSync(workflowDir)) return ["No GitHub Actions workflow detected."];
  return [];
}

function findRiskyMcp(cwd: string) {
  const warnings: string[] = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path.join(cwd, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    if (content.includes("C:\\\\") || (content.includes("/") && content.includes("filesystem"))) {
      warnings.push(`MCP safety: ${fileName} may allow broad filesystem access. Restrict it to this repo if possible.`);
    }
    if (content.includes("*") && content.includes("command"))
      warnings.push(`MCP safety: ${fileName} may allow wildcard command execution.`);
    if (content.includes("env") && content.includes("SECRET"))
      warnings.push(`MCP safety: ${fileName} may expose secret-like environment variables.`);
  }
  return warnings;
}

function suggestionsFor(failures: string[], warnings: string[]) {
  const suggestions: string[] = [];
  if (failures.some((item) => item.includes("AGENTS.md")))
    suggestions.push("Run agentkick init to regenerate the master repo intelligence layer.");
  if (failures.some((item) => item.includes(".claude/skills")))
    suggestions.push("Regenerate Claude skills with agentkick init.");
  if (failures.some((item) => item.includes(".codex/agents")))
    suggestions.push("Regenerate Codex specialist agents with agentkick init.");
  if (warnings.some((item) => item.includes("MCP safety")))
    suggestions.push("Restrict MCP tools to repo-scoped paths and explicit allowlists.");
  if (warnings.some((item) => item.includes("workflow")))
    suggestions.push("Add a CI workflow or run agentkick add github.");
  return [...new Set(suggestions)];
}

function readFileSafe(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function printDetectionDebug(detection: DetectionDebug) {
  console.log("");
  console.log("Stack detection debug:");
  console.log(`Current working directory: ${detection.cwd}`);
  console.log("Files checked:");
  printList(detection.filesChecked);
  console.log("package.json dependencies found:");
  printList(detection.dependencies);
  console.log("Config files found:");
  printList(detection.configFiles);
  console.log("Final detection reasoning:");
  printList(detection.reasoning);
}

function printList(items: string[]) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(`- ${item}`);
}
