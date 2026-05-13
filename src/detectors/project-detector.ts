import fs from "node:fs";
import path from "node:path";
import { existsAny, hasText, listTopLevelFiles, readJsonSafe } from "../utils/fs.js";
import type { DetectionDebug, PackageJson, ProjectProfile, Template, WorkspaceHint } from "../core/types.js";

export function buildProfile(template: Template, projectName: string): ProjectProfile {
  const stackByTemplate: Record<Template, string[]> = {
    "chrome-extension": ["chrome-extension", "javascript", "browser"],
    "ai-saas": ["nextjs", "react", "typescript", "ai-saas", "api-routes"],
    saas: ["nextjs", "react", "typescript", "saas", "api-routes"],
    marketplace: ["nextjs", "react", "typescript", "marketplace", "api-routes"],
    "internal-tool": ["vite", "react", "typescript", "internal-tool"],
    "electron-app": ["electron", "vite", "react", "typescript", "desktop-app"],
    "tauri-app": ["tauri", "vite", "react", "typescript", "desktop-app", "rust"]
  };

  const testCommandByTemplate: Partial<Record<Template, string>> = {
    "chrome-extension": "npm run check",
    "tauri-app": "npm run typecheck"
  };

  const buildCommandByTemplate: Partial<Record<Template, string>> = {
    "chrome-extension": "npm run package",
    "electron-app": "npm run build",
    "tauri-app": "npm run build"
  };

  return {
    name: projectName,
    template,
    stack: stackByTemplate[template] ?? ["generic"],
    packageManager: "npm",
    testCommand: testCommandByTemplate[template] ?? "npm test",
    buildCommand: buildCommandByTemplate[template] ?? "npm run build",
    launchTarget: launchTargetFor(template)
  };
}

export function detectProject(cwd: string): ProjectProfile {
  const packageJson = readJsonSafe<PackageJson>(path.join(cwd, "package.json"));
  const name = packageJson?.name ?? path.basename(cwd);
  const detection = analyzeProject(cwd, packageJson);
  const primaryStack = detection.primaryStack;
  const capabilities = detection.capabilities;
  const stack = primaryStack === "generic" ? [] : [primaryStack, ...capabilities];

  return {
    name,
    template: primaryStack,
    primaryStack,
    capabilities,
    stack,
    detection,
    packageManager: detectPackageManager(cwd, stack),
    testCommand: detectTestCommand(cwd, packageJson, stack),
    buildCommand: detectBuildCommand(cwd, packageJson, stack),
    launchTarget: stack.includes("netlify") ? "Netlify" : "GitHub"
  };
}

export function defaultPacksForTemplate(template: string): string[] {
  return (
    {
      "chrome-extension": ["chrome-extension"],
      "ai-saas": ["nextjs", "security", "github"],
      saas: ["nextjs", "github"],
      marketplace: ["nextjs", "security", "github"],
      "internal-tool": ["github"],
      "electron-app": ["electron", "github"],
      "tauri-app": ["tauri", "github"]
    }[template] ?? []
  );
}

export function packageManagerCommand(cwd: string) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-workspace.yaml")) return "pnpm";
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  return "npm";
}

function hasDependency(packageJson: PackageJson | null, dependency: string) {
  return packageDependencies(packageJson).has(dependency);
}

function hasAnyDependency(packageJson: PackageJson | null, dependencies: string[]) {
  const available = packageDependencies(packageJson);
  return dependencies.some((dependency) => available.has(dependency));
}

function packageDependencies(packageJson: PackageJson | null) {
  const sections: Array<
    keyof Pick<PackageJson, "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies">
  > = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const entries = sections.flatMap((section) => Object.keys(packageJson?.[section] ?? {}));
  return new Set(entries);
}

function analyzeProject(cwd: string, packageJson: PackageJson | null): DetectionDebug {
  const files = listTopLevelFiles(cwd);
  const checked = new Set([
    "package.json",
    "manifest.json",
    "public/manifest.json",
    "src/manifest.json",
    "next.config.*",
    "vite.config.*",
    "tailwind.config.*",
    "prisma/schema.prisma",
    "supabase",
    "app/api",
    "pages/api",
    "src-tauri",
    "tauri.conf.json",
    "docker-compose.yml",
    "docker-compose.yaml",
    "Dockerfile",
    "turbo.json",
    "pnpm-workspace.yaml"
  ]);
  const configFiles = new Set<string>();
  const reasoning = [];
  const detected = new Set<string>();
  const primaryCandidates = new Set<string>();
  const capabilities = new Set<string>();

  const checkPath = (relativePath: string) => {
    checked.add(relativePath);
    return fs.existsSync(path.join(cwd, relativePath));
  };
  const addConfig = (relativePath: string) => {
    configFiles.add(relativePath);
    checked.add(relativePath);
  };
  const addPrimary = (label: string, reason: string) => {
    detected.add(label);
    primaryCandidates.add(label);
    reasoning.push(`${label}: ${reason}`);
  };
  const addCapability = (label: string, reason: string) => {
    detected.add(label);
    capabilities.add(label);
    reasoning.push(`${label}: ${reason}`);
  };

  const topLevelMatches = (pattern: RegExp) => {
    const matches = [...files].filter((file) => pattern.test(file)).sort();
    for (const match of matches) addConfig(match);
    return matches;
  };

  if (topLevelMatches(/^turbo\.json$/).length > 0) addPrimary("monorepo-turborepo", "turbo.json exists");
  if (topLevelMatches(/^pnpm-workspace\.yaml$/).length > 0) addPrimary("monorepo-pnpm", "pnpm-workspace.yaml exists");

  const manifestFiles = ["manifest.json", "public/manifest.json", "src/manifest.json"].filter((file) =>
    checkPath(file)
  );
  const chromeManifest = manifestFiles.find((file) => readJsonSafe(path.join(cwd, file))?.manifest_version);
  if (chromeManifest) {
    addConfig(chromeManifest);
    addPrimary("chrome-extension", `${chromeManifest} contains manifest_version`);
  }

  const nextConfigs = topLevelMatches(/^next\.config\.(js|mjs|cjs|ts)$/);
  if (nextConfigs.length > 0 || hasDependency(packageJson, "next")) {
    addPrimary("nextjs", nextConfigs.length > 0 ? `${nextConfigs[0]} exists` : "package.json depends on next");
  }

  const viteConfigs = topLevelMatches(/^vite\.config\.(js|mjs|cjs|ts|mts|cts)$/);
  if (viteConfigs.length > 0 || hasDependency(packageJson, "vite")) {
    addPrimary("vite", viteConfigs.length > 0 ? `${viteConfigs[0]} exists` : "package.json depends on vite");
  }

  if (packageJson || files.has("package-lock.json") || files.has("pnpm-lock.yaml") || files.has("yarn.lock")) {
    addCapability("nodejs", "Node package metadata or lockfile exists");
    primaryCandidates.add("nodejs");
  }

  if (hasDependency(packageJson, "react")) {
    addCapability("react", "package.json depends on react");
    primaryCandidates.add("react");
  }

  if (hasAnyDependency(packageJson, ["express", "fastify", "hono"])) {
    addPrimary("node-api", "package.json depends on express, fastify, or hono");
  }

  if (checkPath("prisma/schema.prisma")) addCapability("prisma", "prisma/schema.prisma exists");
  if (directoryExists(cwd, "supabase", checked)) addCapability("supabase", "supabase folder exists");
  if (directoryExists(cwd, "app/api", checked) || directoryExists(cwd, "pages/api", checked)) {
    addCapability("api-routes", "app/api or pages/api exists");
  }

  const tailwindConfigs = topLevelMatches(/^tailwind\.config\.(js|mjs|cjs|ts)$/);
  if (tailwindConfigs.length > 0) addCapability("tailwind", `${tailwindConfigs[0]} exists`);

  if (topLevelMatches(/^docker-compose\.ya?ml$/).length > 0 || checkPath("Dockerfile")) {
    addCapability("docker", "docker-compose.yml or Dockerfile exists");
  }

  if (files.has("netlify.toml")) {
    addConfig("netlify.toml");
    addCapability("netlify", "netlify.toml exists");
  }
  if (files.has("pyproject.toml") || files.has("requirements.txt")) addPrimary("python", "Python project files exist");
  if (existsAny(cwd, ["app/main.py"]) && hasText(path.join(cwd, "app/main.py"), "FastAPI"))
    addPrimary("fastapi", "app/main.py imports FastAPI");
  if (existsAny(cwd, ["app.py", "app/__init__.py"]) && hasText(path.join(cwd, "app.py"), "Flask"))
    addPrimary("flask", "Flask app entrypoint detected");
  if (files.has("composer.json")) addPrimary("php", "composer.json exists");
  if (files.has("artisan")) addPrimary("laravel", "artisan exists");
  if (files.has("go.mod")) addPrimary("go", "go.mod exists");
  if (files.has("Cargo.toml")) addPrimary("rust", "Cargo.toml exists");
  if (hasDependency(packageJson, "electron")) addPrimary("electron", "package.json depends on electron");
  if (hasDependency(packageJson, "@tauri-apps/api") || directoryExists(cwd, "src-tauri", checked)) {
    addPrimary("tauri", "Tauri dependency or src-tauri folder exists");
  }
  if (packageJson?.bin) addPrimary("node-cli", "package.json defines bin");

  const primaryStack = pickPrimaryStack(primaryCandidates);
  const orderedCapabilities = orderLabels(
    [...new Set([...capabilities, ...primaryCandidates])].filter((label) => label !== primaryStack)
  );
  const workspaceHints = primaryStack === "generic" ? findWorkspaceHints(cwd) : [];

  if (primaryStack === "generic") {
    reasoning.push("generic: no supported stack markers were found");
    if (workspaceHints.length > 0) {
      reasoning.push(
        `workspace: found project markers in child folders: ${workspaceHints.map((hint) => hint.path).join(", ")}`
      );
    }
  }

  return {
    cwd,
    primaryStack,
    capabilities: orderedCapabilities,
    detected: primaryStack === "generic" ? [] : [primaryStack, ...orderedCapabilities],
    workspaceHints,
    filesChecked: [...checked].sort(),
    dependencies: [...packageDependencies(packageJson)].sort(),
    configFiles: [...configFiles].sort(),
    reasoning
  };
}

function pickPrimaryStack(candidates: Set<string>) {
  const priority = [
    "monorepo-turborepo",
    "monorepo-pnpm",
    "chrome-extension",
    "nextjs",
    "electron",
    "tauri",
    "vite",
    "node-api",
    "fastapi",
    "flask",
    "laravel",
    "go",
    "rust",
    "python",
    "php",
    "react",
    "nodejs",
    "node-cli"
  ];
  return priority.find((label) => candidates.has(label)) ?? "generic";
}

function orderLabels(labels: string[]) {
  const priority = [
    "react",
    "tailwind",
    "prisma",
    "supabase",
    "api-routes",
    "nodejs",
    "docker",
    "netlify",
    "nextjs",
    "vite",
    "node-api",
    "electron",
    "tauri",
    "chrome-extension",
    "monorepo-turborepo",
    "monorepo-pnpm"
  ];
  return labels.sort((a, b) => {
    const aIndex = priority.includes(a) ? priority.indexOf(a) : priority.length;
    const bIndex = priority.includes(b) ? priority.indexOf(b) : priority.length;
    return aIndex - bIndex || a.localeCompare(b);
  });
}

function directoryExists(cwd: string, relativePath: string, checked = new Set<string>()) {
  checked.add(relativePath);
  try {
    return fs.statSync(path.join(cwd, relativePath)).isDirectory();
  } catch {
    return false;
  }
}

function findWorkspaceHints(cwd: string): WorkspaceHint[] {
  const ignored = new Set([".git", ".next", "dist", "build", "node_modules", "vendor", "target"]);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(cwd, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory() && !ignored.has(entry.name))
    .map((entry) => childProjectHint(cwd, entry.name))
    .filter((hint): hint is WorkspaceHint => Boolean(hint))
    .slice(0, 8);
}

function childProjectHint(cwd: string, name: string): WorkspaceHint | null {
  const child = path.join(cwd, name);
  const files = listTopLevelFiles(child);
  const packageJson = readJsonSafe<PackageJson>(path.join(child, "package.json"));
  const evidence: string[] = [];
  const candidates = new Set<string>();

  if (files.has("turbo.json")) addHint(candidates, evidence, "monorepo-turborepo", "turbo.json");
  if (files.has("pnpm-workspace.yaml")) addHint(candidates, evidence, "monorepo-pnpm", "pnpm-workspace.yaml");

  const manifest = readJsonSafe<{ manifest_version?: number }>(path.join(child, "manifest.json"));
  if (manifest?.manifest_version) addHint(candidates, evidence, "chrome-extension", "manifest.json");

  if (hasDependency(packageJson, "next") || hasMatchingFile(files, /^next\.config\.(js|mjs|cjs|ts)$/)) {
    addHint(candidates, evidence, "nextjs", hasDependency(packageJson, "next") ? "package.json next" : "next.config.*");
  }
  if (hasDependency(packageJson, "vite") || hasMatchingFile(files, /^vite\.config\.(js|mjs|cjs|ts|mts|cts)$/)) {
    addHint(candidates, evidence, "vite", hasDependency(packageJson, "vite") ? "package.json vite" : "vite.config.*");
  }
  if (hasAnyDependency(packageJson, ["express", "fastify", "hono"])) {
    addHint(candidates, evidence, "node-api", "package.json API dependency");
  }
  if (hasDependency(packageJson, "react")) addHint(candidates, evidence, "react", "package.json react");
  if (hasDependency(packageJson, "electron")) addHint(candidates, evidence, "electron", "package.json electron");
  if (hasDependency(packageJson, "@tauri-apps/api") || files.has("src-tauri"))
    addHint(candidates, evidence, "tauri", "Tauri markers");
  if (packageJson?.bin) addHint(candidates, evidence, "node-cli", "package.json bin");
  if (files.has("pyproject.toml") || files.has("requirements.txt"))
    addHint(candidates, evidence, "python", "Python project files");
  if (files.has("composer.json")) addHint(candidates, evidence, "php", "composer.json");
  if (files.has("go.mod")) addHint(candidates, evidence, "go", "go.mod");
  if (files.has("Cargo.toml")) addHint(candidates, evidence, "rust", "Cargo.toml");

  const stack = pickPrimaryStack(candidates);
  if (stack === "generic") return null;
  return { path: name, stack, evidence };
}

function addHint(candidates: Set<string>, evidence: string[], stack: string, reason: string) {
  candidates.add(stack);
  evidence.push(reason);
}

function hasMatchingFile(files: Set<string>, pattern: RegExp) {
  return [...files].some((file) => pattern.test(file));
}

function detectPackageManager(cwd: string, stack: string[]) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-workspace.yaml")) return "pnpm";
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  if (stack.includes("laravel") || files.has("composer.json")) return "composer";
  if (stack.includes("go")) return "go";
  if (stack.includes("rust")) return "cargo";
  if (stack.includes("python") || files.has("pyproject.toml") || files.has("requirements.txt")) return "python";
  return "npm";
}

function detectTestCommand(cwd: string, packageJson: PackageJson | null, stack: string[]) {
  if (packageJson?.scripts?.test) return `${packageManagerCommand(cwd)} test`;
  if (stack.includes("laravel")) return "php artisan test";
  if (stack.includes("go")) return "go test ./...";
  if (stack.includes("rust")) return "cargo test";
  if (stack.includes("python")) return "python -m pytest";
  return "document the test command";
}

function detectBuildCommand(cwd: string, packageJson: PackageJson | null, stack: string[]) {
  if (packageJson?.scripts?.build) return `${packageManagerCommand(cwd)} run build`;
  if (stack.includes("laravel")) return "composer install && php artisan test";
  if (stack.includes("go")) return "go build ./...";
  if (stack.includes("rust")) return "cargo build";
  if (stack.includes("python")) return "python -m compileall .";
  return "document the build command";
}

function launchTargetFor(template: Template) {
  const launchTargets: Partial<Record<Template, string>> = {
    "chrome-extension": "Chrome Web Store",
    "ai-saas": "Vercel or Netlify",
    saas: "Vercel or Netlify",
    marketplace: "Vercel or Netlify",
    "internal-tool": "Vercel, Netlify, or internal hosting",
    "electron-app": "Desktop release",
    "tauri-app": "Desktop release"
  };
  return launchTargets[template] ?? "GitHub";
}
