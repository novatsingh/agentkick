import fs from "node:fs";
import path from "node:path";
import { SCAN_IGNORED_DIRS, SOURCE_EXTENSIONS } from "./constants.js";
import type { RepoFile } from "./types.js";
import { isMemoryFile, lineCount, readFileSafe, slash } from "./utils.js";

export function scanRepoFiles(cwd: string) {
  const results: RepoFile[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = slash(path.relative(cwd, fullPath));
      if (entry.isDirectory()) {
        if (!SCAN_IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!SOURCE_EXTENSIONS.has(extension) && !isMemoryFile(relativePath)) continue;
      const stats = fs.statSync(fullPath);
      if (stats.size > 700_000) continue;
      const content = readFileSafe(fullPath);
      results.push({
        relativePath,
        absolutePath: fullPath,
        extension,
        bytes: stats.size,
        lines: lineCount(content),
        isReact: extension === ".tsx" || extension === ".jsx"
      });
    }
  };
  walk(cwd);
  return results;
}
