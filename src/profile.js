import path from "node:path";
import { existsAny, hasText, listTopLevelFiles, readJsonSafe } from "./fs-utils.js";

export function buildProfile(template, projectName) {
  const stackByTemplate = {
    "chrome-extension": ["chrome-extension", "javascript", "browser"],
    nextjs: ["nextjs", "react", "typescript"],
    "landing-page": ["static-site", "netlify"],
    "node-cli": ["node-cli", "javascript"],
    fastapi: ["fastapi", "python", "api"],
    flask: ["flask", "python", "api"],
    laravel: ["laravel", "php", "web"],
    "go-cli": ["go", "cli"],
    "rust-cli": ["rust", "cli"],
    electron: ["electron", "javascript", "desktop"]
  };

  const packageManagerByTemplate = {
    fastapi: "python",
    flask: "python",
    laravel: "composer",
    "go-cli": "go",
    "rust-cli": "cargo"
  };

  const testCommandByTemplate = {
    "landing-page": "npm run check",
    fastapi: "python -m pytest",
    flask: "python -m pytest",
    laravel: "php artisan test",
    "go-cli": "go test ./...",
    "rust-cli": "cargo test"
  };

  const buildCommandByTemplate = {
    "chrome-extension": "npm run package",
    fastapi: "python -m compileall app tests",
    flask: "python -m compileall app tests",
    laravel: "composer install && php artisan test",
    "go-cli": "go build ./...",
    "rust-cli": "cargo build"
  };

  return {
    name: projectName,
    template,
    stack: stackByTemplate[template] ?? ["generic"],
    packageManager: packageManagerByTemplate[template] ?? "npm",
    testCommand: testCommandByTemplate[template] ?? "npm test",
    buildCommand: buildCommandByTemplate[template] ?? "npm run build",
    launchTarget: launchTargetFor(template)
  };
}

export function detectProject(cwd) {
  const packageJson = readJsonSafe(path.join(cwd, "package.json"));
  const name = packageJson?.name ?? path.basename(cwd);
  const files = listTopLevelFiles(cwd);
  const stack = [];

  if (files.has("manifest.json") || existsAny(cwd, ["public/manifest.json", "src/manifest.json"])) stack.push("chrome-extension");
  if (files.has("next.config.js") || files.has("next.config.mjs") || hasDependency(packageJson, "next")) stack.push("nextjs");
  if (hasDependency(packageJson, "react")) stack.push("react");
  if (files.has("netlify.toml")) stack.push("netlify");
  if (files.has("Dockerfile") || files.has("docker-compose.yml")) stack.push("docker");
  if (files.has("pyproject.toml") || files.has("requirements.txt")) stack.push("python");
  if (existsAny(cwd, ["app/main.py"]) && hasText(path.join(cwd, "app/main.py"), "FastAPI")) stack.push("fastapi");
  if (existsAny(cwd, ["app.py", "app/__init__.py"]) && hasText(path.join(cwd, "app.py"), "Flask")) stack.push("flask");
  if (files.has("composer.json")) stack.push("php");
  if (files.has("artisan")) stack.push("laravel");
  if (files.has("go.mod")) stack.push("go");
  if (files.has("Cargo.toml")) stack.push("rust");
  if (hasDependency(packageJson, "electron")) stack.push("electron");
  if (packageJson?.bin) stack.push("node-cli");

  return {
    name,
    template: stack[0] ?? "generic",
    stack,
    packageManager: detectPackageManager(cwd, stack),
    testCommand: detectTestCommand(cwd, packageJson, stack),
    buildCommand: detectBuildCommand(cwd, packageJson, stack),
    launchTarget: stack.includes("netlify") ? "Netlify" : "GitHub"
  };
}

export function defaultPacksForTemplate(template) {
  return {
    "chrome-extension": ["chrome-extension"],
    nextjs: ["nextjs"],
    "landing-page": ["netlify"],
    "node-cli": ["github"],
    fastapi: ["python"],
    flask: ["python"],
    laravel: ["php"],
    "go-cli": ["go", "github"],
    "rust-cli": ["rust", "github"],
    electron: ["electron", "github"]
  }[template] ?? [];
}

export function packageManagerCommand(cwd) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  return "npm";
}

function hasDependency(packageJson, dependency) {
  return Boolean(packageJson?.dependencies?.[dependency] || packageJson?.devDependencies?.[dependency]);
}

function detectPackageManager(cwd, stack) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  if (stack.includes("laravel") || files.has("composer.json")) return "composer";
  if (stack.includes("go")) return "go";
  if (stack.includes("rust")) return "cargo";
  if (stack.includes("python") || files.has("pyproject.toml") || files.has("requirements.txt")) return "python";
  return "npm";
}

function detectTestCommand(cwd, packageJson, stack) {
  if (packageJson?.scripts?.test) return `${packageManagerCommand(cwd)} test`;
  if (stack.includes("laravel")) return "php artisan test";
  if (stack.includes("go")) return "go test ./...";
  if (stack.includes("rust")) return "cargo test";
  if (stack.includes("python")) return "python -m pytest";
  return "document the test command";
}

function detectBuildCommand(cwd, packageJson, stack) {
  if (packageJson?.scripts?.build) return `${packageManagerCommand(cwd)} run build`;
  if (stack.includes("laravel")) return "composer install && php artisan test";
  if (stack.includes("go")) return "go build ./...";
  if (stack.includes("rust")) return "cargo build";
  if (stack.includes("python")) return "python -m compileall .";
  return "document the build command";
}

function launchTargetFor(template) {
  return {
    "landing-page": "Netlify",
    fastapi: "Docker or Render",
    flask: "Docker or Render",
    laravel: "Laravel hosting",
    "go-cli": "GitHub Releases",
    "rust-cli": "GitHub Releases",
    electron: "GitHub Releases"
  }[template] ?? "GitHub";
}
