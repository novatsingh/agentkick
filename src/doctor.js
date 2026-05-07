import fs from "node:fs";
import path from "node:path";
import { readJsonSafe } from "./fs-utils.js";

export function runDoctor(cwd) {
  const checks = [
    fileCheck(cwd, "AGENTS.md", "Codex/OpenAI agent instructions"),
    fileCheck(cwd, "CLAUDE.md", "Claude Code project memory"),
    fileCheck(cwd, ".github/copilot-instructions.md", "GitHub Copilot instructions"),
    fileCheck(cwd, ".cursor/rules/agentkick.mdc", "Cursor rules"),
    fileCheck(cwd, ".agentkick.json", "AgentKick config")
  ];
  const riskyMcp = findRiskyMcp(cwd);
  const packageInfo = readJsonSafe(path.join(cwd, "package.json"));
  const config = readJsonSafe(path.join(cwd, ".agentkick.json"));

  console.log("AgentKick doctor\n");

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "WARN"} ${check.label}: ${check.message}`);
  }

  if (packageInfo?.scripts) {
    console.log(`PASS package scripts: ${Object.keys(packageInfo.scripts).join(", ") || "none"}`);
  } else if (config?.testCommand && !config.testCommand.startsWith("document ")) {
    console.log(`PASS project commands: ${config.testCommand}`);
  } else {
    console.log("WARN project commands: no package scripts or documented test command detected");
  }

  if (riskyMcp.length > 0) {
    for (const warning of riskyMcp) console.log(`WARN MCP safety: ${warning}`);
  } else {
    console.log("PASS MCP safety: no broad filesystem MCP access detected");
  }

  const failed = checks.filter((check) => !check.ok).length + riskyMcp.length;
  console.log("");
  console.log(failed === 0 ? "Project looks agent-ready." : `Found ${failed} item(s) to review.`);
}

function fileCheck(cwd, relativePath, label) {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

function findRiskyMcp(cwd) {
  const warnings = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path.join(cwd, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    if (content.includes("C:\\\\") || (content.includes("/") && content.includes("filesystem"))) {
      warnings.push(`${fileName} may allow broad filesystem access. Restrict it to this repo if possible.`);
    }
  }
  return warnings;
}
