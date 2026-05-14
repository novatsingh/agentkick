import fs from "node:fs";
import path from "node:path";
import type { DoctorCheck } from "./types.js";

export function requiredFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: false, label, message: `missing ${relativePath}` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}

export function optionalFile(cwd: string, relativePath: string, label: string): DoctorCheck {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) return { ok: true, label, message: `optional: ${relativePath} not present` };
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) return { ok: false, label, message: `${relativePath} looks too small` };
  return { ok: true, label, message: relativePath };
}
