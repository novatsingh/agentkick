import fs from "node:fs";
import path from "node:path";

let writeMode = { dryRun: false };

export function setWriteMode(mode) {
  writeMode = { ...writeMode, ...mode };
}

export function ensureDir(dir) {
  if (writeMode.dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

export function writeFile(cwd, relativePath, content) {
  writeAbsoluteFile(path.join(cwd, relativePath), content);
}

export function writeAbsoluteFile(file, content) {
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

export function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function listTopLevelFiles(cwd) {
  try {
    return new Set(fs.readdirSync(cwd));
  } catch {
    return new Set();
  }
}

export function existsAny(cwd, candidates) {
  return candidates.some((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

export function hasText(file, text) {
  try {
    return fs.readFileSync(file, "utf8").includes(text);
  } catch {
    return false;
  }
}

export function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
