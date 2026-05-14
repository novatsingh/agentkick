import fs from "node:fs";
import path from "node:path";
import type { DetectionDebug } from "../core/types.js";

export function pathCoveredByGuidance(item: string, guidance: string) {
  const lower = item.toLowerCase();
  if (guidance.includes(lower)) return true;
  if (["dist", "build", "out", ".next", ".turbo", "coverage", "release"].includes(lower)) {
    return guidance.includes("generated") || guidance.includes("build");
  }
  if (["node_modules", "vendor", "target"].includes(lower)) {
    return guidance.includes("vendor") || guidance.includes("dependency");
  }
  return false;
}

export function commandFor(profileCommand: string, scriptName: "test" | "build", packageScript?: string) {
  if (profileCommand && !profileCommand.startsWith("document ")) return profileCommand;
  if (packageScript) return scriptName === "test" ? "npm test" : "npm run build";
  return "not detected";
}

export function readFileSafe(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

export function lineCount(content: string) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

export function directoryExists(cwd: string, relativePath: string) {
  try {
    return fs.statSync(path.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}

export function isMemoryFile(relativePath: string) {
  return relativePath.endsWith(".md") || relativePath === ".agentkick.json";
}

export function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "root"
  );
}

export function slash(value: string) {
  return value.replace(/\\/g, "/");
}

export function fallbackDetection(cwd: string, stack: string, detected: string[]): DetectionDebug {
  return {
    cwd,
    primaryStack: stack,
    capabilities: [],
    detected,
    workspaceHints: [],
    filesChecked: [],
    dependencies: [],
    configFiles: [],
    reasoning: []
  };
}
