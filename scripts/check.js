#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { detectProject } from "../src/profile.js";

const roots = ["bin", "src", "scripts"];
const files = roots.flatMap((root) => findJsFiles(path.resolve(root)));
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) process.exitCode = 1;
else runDetectionTests();

function findJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findJsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

function runDetectionTests() {
  const root = path.resolve(".agentkick-check-tmp");
  safeRemove(root);
  fs.mkdirSync(root, { recursive: true });

  try {
    const next = makeProject(root, "next-app", {
      "package.json": json({
        name: "next-app",
        dependencies: { next: "^14.0.0", react: "^18.0.0" }
      }),
      "tailwind.config.js": "export default {};",
      "prisma/schema.prisma": "datasource db { provider = \"postgresql\" }",
      "app/api/health/route.ts": "export function GET() {}"
    });
    assertDetection(next, "nextjs", ["react", "tailwind", "prisma", "api-routes"]);

    const vite = makeProject(root, "vite-app", {
      "package.json": json({
        name: "vite-app",
        devDependencies: { vite: "^5.0.0" },
        dependencies: { react: "^18.0.0" }
      }),
      "vite.config.ts": "export default {};",
      "supabase/config.toml": ""
    });
    assertDetection(vite, "vite", ["react", "supabase"]);

    const extension = makeProject(root, "extension", {
      "manifest.json": json({ manifest_version: 3, name: "Extension" })
    });
    assertDetection(extension, "chrome-extension", []);

    const api = makeProject(root, "api", {
      "package.json": json({
        name: "api",
        dependencies: { express: "^4.0.0" }
      }),
      "docker-compose.yml": "services: {}"
    });
    assertDetection(api, "node-api", ["docker"]);

    const monorepo = makeProject(root, "monorepo", {
      "package.json": json({
        name: "monorepo",
        dependencies: { react: "^18.0.0" }
      }),
      "turbo.json": json({ tasks: {} }),
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n"
    });
    assertDetection(monorepo, "monorepo-turborepo", ["react", "monorepo-pnpm"]);

    const generic = makeProject(root, "generic", {
      "README.md": "# Generic\n"
    });
    assert.equal(detectProject(generic).primaryStack, "generic");
  } finally {
    safeRemove(root);
  }
}

function makeProject(root, name, files) {
  const dir = path.join(root, name);
  for (const [relativePath, content] of Object.entries(files)) {
    const file = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }
  return dir;
}

function assertDetection(cwd, primaryStack, capabilities) {
  const profile = detectProject(cwd);
  assert.equal(profile.primaryStack, primaryStack);
  for (const capability of capabilities) {
    assert.ok(profile.capabilities.includes(capability), `${primaryStack} missing ${capability}`);
  }
}

function safeRemove(target) {
  const resolved = path.resolve(target);
  const workspace = path.resolve(".");
  if (!resolved.startsWith(`${workspace}${path.sep}`)) {
    throw new Error(`refusing to remove outside workspace: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function json(value) {
  return JSON.stringify(value, null, 2);
}
