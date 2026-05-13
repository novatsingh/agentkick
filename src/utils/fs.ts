import path from "node:path";
import fs from "fs-extra";

let writeMode = { dryRun: false };

export function setWriteMode(mode: Partial<typeof writeMode>) {
  writeMode = { ...writeMode, ...mode };
}

export function ensureDir(dir: string) {
  if (writeMode.dryRun) return;
  fs.ensureDirSync(dir);
}

export function writeFile(cwd: string, relativePath: string, content: string) {
  writeAbsoluteFile(path.join(cwd, relativePath), content);
}

export function writeAbsoluteFile(file: string, content: string) {
  if (writeMode.dryRun) {
    const action = fs.existsSync(file) ? "update" : "create";
    console.log(`DRY-RUN would ${action}: ${file}`);
    return;
  }
  ensureDir(path.dirname(file));
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, "utf8");
    if (existing === content) return;
    const backup = `${file}.agentkick-backup`;
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, existing, "utf8");
  }
  fs.writeFileSync(file, content, "utf8");
}

export function readJsonSafe<T = Record<string, unknown>>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function listTopLevelFiles(cwd: string): Set<string> {
  try {
    return new Set(fs.readdirSync(cwd));
  } catch {
    return new Set();
  }
}

export function existsAny(cwd: string, candidates: string[]) {
  return candidates.some((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

export function hasText(file: string, text: string) {
  try {
    return fs.readFileSync(file, "utf8").includes(text);
  } catch {
    return false;
  }
}

export function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
