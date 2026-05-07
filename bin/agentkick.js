#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";

const VERSION = "0.1.0";

const SUPPORTED_TEMPLATES = [
  "chrome-extension",
  "nextjs",
  "landing-page",
  "node-cli",
  "fastapi",
  "flask",
  "laravel",
  "go-cli",
  "rust-cli",
  "electron"
];

const SUPPORTED_PACKS = [
  "core",
  "chrome-extension",
  "nextjs",
  "netlify",
  "security",
  "github",
  "python",
  "php",
  "go",
  "rust",
  "electron"
];

const args = process.argv.slice(2);
const command = args[0] ?? "help";

main().catch((error) => {
  console.error(`agentkick failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log(VERSION);
    return;
  }

  if (command === "new") {
    await createNewProject(args.slice(1));
    return;
  }

  if (command === "init") {
    initExistingProject(process.cwd(), args.slice(1));
    return;
  }

  if (command === "add") {
    addPack(process.cwd(), args.slice(1));
    return;
  }

  if (command === "doctor") {
    runDoctor(process.cwd());
    return;
  }

  throw new Error(`unknown command "${command}". Run "agentkick help".`);
}

function printHelp() {
  console.log(`AgentKick ${VERSION}

Usage:
  agentkick new [template] [project-name]
  agentkick init
  agentkick add <pack>
  agentkick doctor

Templates:
  ${SUPPORTED_TEMPLATES.join(", ")}

Packs:
  ${SUPPORTED_PACKS.join(", ")}

Examples:
  agentkick new
  agentkick new chrome-extension maps-lead-finder
  agentkick new landing-page my-launch-site
  cd existing-repo && agentkick init
  agentkick add security
  agentkick doctor`);
}

async function createNewProject(input) {
  let template = input[0];
  let projectName = input[1];

  if (!template || !projectName) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("usage: agentkick new <template> <project-name>");
    }

    const answers = await promptForNewProject({ template, projectName });
    template = answers.template;
    projectName = answers.projectName;
  }

  if (!SUPPORTED_TEMPLATES.includes(template)) {
    throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
  }

  const projectDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(projectDir)) {
    throw new Error(`target folder already exists: ${projectDir}`);
  }

  const profile = buildProfile(template, projectName);
  writeTemplateProject(projectDir, profile);
  writeAgentFiles(projectDir, profile);
  writePack(projectDir, "core", profile);

  for (const pack of defaultPacksForTemplate(template)) {
    writePack(projectDir, pack, profile);
  }

  console.log(`Created ${projectName} using ${template}.`);
  console.log(`Next steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  agentkick doctor`);
}

function defaultPacksForTemplate(template) {
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

async function promptForNewProject(defaults) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log("AgentKick project setup");
    console.log("");
    SUPPORTED_TEMPLATES.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    console.log("");

    const templateAnswer = defaults.template ?? await rl.question("Project type [1]: ");
    const template = resolveTemplateAnswer(templateAnswer || "1");
    const nameAnswer = defaults.projectName ?? await rl.question("Project name: ");
    const projectName = sanitizeProjectName(nameAnswer);

    if (!projectName) {
      throw new Error("project name is required");
    }

    return { template, projectName };
  } finally {
    rl.close();
  }
}

function resolveTemplateAnswer(answer) {
  const normalized = String(answer).trim();
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= SUPPORTED_TEMPLATES.length) {
    return SUPPORTED_TEMPLATES[numeric - 1];
  }
  if (SUPPORTED_TEMPLATES.includes(normalized)) {
    return normalized;
  }
  throw new Error(`unknown template "${answer}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
}

function sanitizeProjectName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initExistingProject(cwd) {
  const profile = detectProject(cwd);
  writeAgentFiles(cwd, profile);
  writePack(cwd, "core", profile);
  console.log(`Initialized AI-agent setup for ${profile.name}.`);
  console.log(`Detected stack: ${profile.stack.join(", ") || "generic"}`);
}

function addPack(cwd, input) {
  const pack = input[0];
  if (!pack) {
    throw new Error("usage: agentkick add <pack>");
  }
  if (!SUPPORTED_PACKS.includes(pack)) {
    throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
  }

  const profile = detectProject(cwd);
  writePack(cwd, pack, profile);
  updateAgentkickConfig(cwd, { addedPacks: [pack] });
  console.log(`Added ${pack} pack.`);
}

function runDoctor(cwd) {
  const checks = [
    fileCheck(cwd, "AGENTS.md", "Codex/OpenAI agent instructions"),
    fileCheck(cwd, "CLAUDE.md", "Claude Code project memory"),
    fileCheck(cwd, ".github/copilot-instructions.md", "GitHub Copilot instructions"),
    fileCheck(cwd, ".cursor/rules/agentkick.mdc", "Cursor rules"),
    fileCheck(cwd, ".agentkick.json", "AgentKick config")
  ];

  const riskyMcp = findRiskyMcp(cwd);
  const packageInfo = readJsonSafe(path.join(cwd, "package.json"));
  const agentkickConfig = readJsonSafe(path.join(cwd, ".agentkick.json"));

  console.log("AgentKick doctor");
  console.log("");

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "WARN"} ${check.label}: ${check.message}`);
  }

  if (packageInfo?.scripts) {
    const scripts = Object.keys(packageInfo.scripts);
    console.log(`PASS package scripts: ${scripts.join(", ") || "none"}`);
  } else if (agentkickConfig?.testCommand && !agentkickConfig.testCommand.startsWith("document ")) {
    console.log(`PASS project commands: ${agentkickConfig.testCommand}`);
  } else {
    console.log("WARN project commands: no package scripts or documented test command detected");
  }

  if (riskyMcp.length > 0) {
    for (const warning of riskyMcp) {
      console.log(`WARN MCP safety: ${warning}`);
    }
  } else {
    console.log("PASS MCP safety: no broad filesystem MCP access detected");
  }

  const failed = checks.filter((check) => !check.ok).length + riskyMcp.length;
  console.log("");
  console.log(failed === 0 ? "Project looks agent-ready." : `Found ${failed} item(s) to review.`);
}

function buildProfile(template, projectName) {
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
  const launchTargetByTemplate = {
    "landing-page": "Netlify",
    fastapi: "Docker or Render",
    flask: "Docker or Render",
    laravel: "Laravel hosting",
    "go-cli": "GitHub Releases",
    "rust-cli": "GitHub Releases",
    electron: "GitHub Releases"
  };

  return {
    name: projectName,
    template,
    stack: stackByTemplate[template] ?? ["generic"],
    packageManager: packageManagerByTemplate[template] ?? "npm",
    testCommand: testCommandByTemplate[template] ?? "npm test",
    buildCommand: buildCommandByTemplate[template] ?? "npm run build",
    launchTarget: launchTargetByTemplate[template] ?? "GitHub"
  };
}

function detectProject(cwd) {
  const packageJson = readJsonSafe(path.join(cwd, "package.json"));
  const name = packageJson?.name ?? path.basename(cwd);
  const files = listTopLevelFiles(cwd);
  const stack = [];

  if (files.has("manifest.json") || existsAny(cwd, ["public/manifest.json", "src/manifest.json"])) {
    stack.push("chrome-extension");
  }
  if (files.has("next.config.js") || files.has("next.config.mjs") || hasDependency(packageJson, "next")) {
    stack.push("nextjs");
  }
  if (hasDependency(packageJson, "react")) {
    stack.push("react");
  }
  if (files.has("netlify.toml")) {
    stack.push("netlify");
  }
  if (files.has("Dockerfile") || files.has("docker-compose.yml")) {
    stack.push("docker");
  }
  if (files.has("pyproject.toml") || files.has("requirements.txt")) {
    stack.push("python");
  }
  if (existsAny(cwd, ["app/main.py"]) && hasText(path.join(cwd, "app/main.py"), "FastAPI")) {
    stack.push("fastapi");
  }
  if (existsAny(cwd, ["app.py", "app/__init__.py"]) && hasText(path.join(cwd, "app.py"), "Flask")) {
    stack.push("flask");
  }
  if (files.has("composer.json")) {
    stack.push("php");
  }
  if (files.has("artisan")) {
    stack.push("laravel");
  }
  if (files.has("go.mod")) {
    stack.push("go");
  }
  if (files.has("Cargo.toml")) {
    stack.push("rust");
  }
  if (hasDependency(packageJson, "electron")) {
    stack.push("electron");
  }
  if (packageJson?.bin) {
    stack.push("node-cli");
  }

  const packageManager = detectPackageManager(cwd, stack);

  return {
    name,
    template: stack[0] ?? "generic",
    stack,
    packageManager,
    testCommand: detectTestCommand(cwd, packageJson, stack),
    buildCommand: detectBuildCommand(cwd, packageJson, stack),
    launchTarget: stack.includes("netlify") ? "Netlify" : "GitHub"
  };
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

function writeTemplateProject(projectDir, profile) {
  ensureDir(projectDir);

  if (profile.template === "chrome-extension") {
    writeFile(projectDir, "package.json", json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      scripts: {
        check: "node --check src/background.js && node --check src/popup.js",
        package: "node scripts/package-extension.js",
        test: "npm run check"
      },
      devDependencies: {}
    }));
    writeFile(projectDir, "manifest.json", json({
      manifest_version: 3,
      name: titleize(profile.name),
      version: "0.1.0",
      description: "Chrome extension scaffold generated by AgentKick.",
      action: {
        default_popup: "src/popup.html"
      },
      background: {
        service_worker: "src/background.js",
        type: "module"
      },
      permissions: ["storage"]
    }));
    writeFile(projectDir, "src/background.js", "chrome.runtime.onInstalled.addListener(() => {\n  console.log('Extension installed.');\n});\n");
    writeFile(projectDir, "src/popup.html", "<!doctype html>\n<html>\n  <head>\n    <meta charset=\"utf-8\">\n    <link rel=\"stylesheet\" href=\"popup.css\">\n  </head>\n  <body>\n    <main>\n      <h1>AgentKick Extension</h1>\n      <button id=\"run\">Run</button>\n      <p id=\"status\">Ready</p>\n    </main>\n    <script type=\"module\" src=\"popup.js\"></script>\n  </body>\n</html>\n");
    writeFile(projectDir, "src/popup.css", "body { margin: 0; width: 360px; font-family: Georgia, serif; background: #f5efe2; color: #221b14; }\nmain { padding: 18px; }\nbutton { border: 0; border-radius: 999px; padding: 10px 14px; background: #1f5134; color: white; cursor: pointer; }\n");
    writeFile(projectDir, "src/popup.js", "const button = document.querySelector('#run');\nconst status = document.querySelector('#status');\n\nbutton.addEventListener('click', () => {\n  status.textContent = 'Clicked.';\n});\n");
    writeFile(projectDir, "scripts/package-extension.js", "import fs from 'node:fs';\nimport path from 'node:path';\n\nconst outDir = path.resolve('dist');\nfs.mkdirSync(outDir, { recursive: true });\nconsole.log('Package step placeholder. Add zip creation before publishing.');\n");
  }

  if (profile.template === "nextjs") {
    writeFile(projectDir, "package.json", json({
      name: profile.name,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        test: "npm run build"
      },
      dependencies: {
        next: "latest",
        react: "latest",
        "react-dom": "latest"
      },
      devDependencies: {
        typescript: "latest",
        "@types/node": "latest",
        "@types/react": "latest"
      }
    }));
    writeFile(projectDir, "app/page.tsx", "export default function Home() {\n  return (\n    <main>\n      <h1>AgentKick Next.js App</h1>\n      <p>Start building with agent-ready project instructions.</p>\n    </main>\n  );\n}\n");
    writeFile(projectDir, "app/layout.tsx", "import type { ReactNode } from 'react';\nimport './globals.css';\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>{children}</body>\n    </html>\n  );\n}\n");
    writeFile(projectDir, "app/globals.css", "body { margin: 0; font-family: Georgia, serif; background: #f6f0e6; color: #1f1b16; }\nmain { min-height: 100vh; display: grid; place-content: center; padding: 32px; }\n");
    writeFile(projectDir, "next.config.mjs", "const nextConfig = {};\nexport default nextConfig;\n");
    writeFile(projectDir, "tsconfig.json", json({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }));
  }

  if (profile.template === "landing-page") {
    writeFile(projectDir, "package.json", json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "node scripts/serve.js",
        check: "node --check scripts/serve.js",
        build: "npm run check"
      }
    }));
    writeFile(projectDir, "index.html", "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <title>AgentKick Launch</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n  </head>\n  <body>\n    <main class=\"hero\">\n      <p class=\"eyebrow\">Agent-ready from day one</p>\n      <h1>Launch faster with Codex, Claude, Cursor, and GitHub ready.</h1>\n      <p>Create the product, repo instructions, commands, and launch checklist together.</p>\n      <a href=\"https://github.com/\" class=\"cta\">Star on GitHub</a>\n    </main>\n  </body>\n</html>\n");
    writeFile(projectDir, "styles.css", ":root { color-scheme: light; --ink: #1d1912; --paper: #f4ead7; --accent: #b7442e; }\nbody { margin: 0; min-height: 100vh; font-family: Georgia, serif; background: radial-gradient(circle at top left, #ffd9a3, transparent 35%), var(--paper); color: var(--ink); }\n.hero { max-width: 880px; padding: 96px 28px; margin: auto; }\n.eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 13px; }\nh1 { font-size: clamp(42px, 8vw, 88px); line-height: .92; margin: 0 0 24px; }\np { font-size: 20px; max-width: 620px; }\n.cta { display: inline-block; margin-top: 18px; padding: 14px 18px; border-radius: 999px; background: var(--accent); color: white; text-decoration: none; }\n");
    writeFile(projectDir, "scripts/serve.js", "import http from 'node:http';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst server = http.createServer((request, response) => {\n  const file = request.url === '/styles.css' ? 'styles.css' : 'index.html';\n  const body = fs.readFileSync(path.resolve(file));\n  response.setHeader('content-type', file.endsWith('.css') ? 'text/css' : 'text/html');\n  response.end(body);\n});\n\nserver.listen(3000, () => console.log('http://localhost:3000'));\n");
    writeFile(projectDir, "netlify.toml", "[build]\n  publish = \".\"\n  command = \"npm run build\"\n");
  }

  if (profile.template === "node-cli") {
    writeFile(projectDir, "package.json", json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      bin: {
        [profile.name]: "./bin/cli.js"
      },
      scripts: {
        check: "node --check bin/cli.js",
        test: "npm run check"
      }
    }));
    writeFile(projectDir, "bin/cli.js", "#!/usr/bin/env node\nconsole.log('Hello from your AgentKick CLI.');\n");
  }

  if (profile.template === "fastapi") {
    writeFile(projectDir, "pyproject.toml", `[project]
name = "${profile.name}"
version = "0.1.0"
description = "FastAPI app generated by AgentKick."
requires-python = ">=3.11"
dependencies = [
  "fastapi",
  "uvicorn[standard]"
]

[project.optional-dependencies]
dev = ["pytest", "httpx"]

[tool.pytest.ini_options]
testpaths = ["tests"]
`);
    writeFile(projectDir, "app/main.py", "from fastapi import FastAPI\n\napp = FastAPI(title=\"AgentKick FastAPI App\")\n\n\n@app.get(\"/\")\ndef read_root():\n    return {\"status\": \"ok\", \"service\": \"agentkick\"}\n");
    writeFile(projectDir, "tests/test_health.py", "from fastapi.testclient import TestClient\n\nfrom app.main import app\n\n\ndef test_read_root():\n    client = TestClient(app)\n    response = client.get(\"/\")\n    assert response.status_code == 200\n    assert response.json()[\"status\"] == \"ok\"\n");
    writeFile(projectDir, "Dockerfile", "FROM python:3.12-slim\nWORKDIR /app\nCOPY pyproject.toml ./\nRUN pip install --no-cache-dir .\nCOPY app ./app\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n");
  }

  if (profile.template === "flask") {
    writeFile(projectDir, "pyproject.toml", `[project]
name = "${profile.name}"
version = "0.1.0"
description = "Flask app generated by AgentKick."
requires-python = ">=3.11"
dependencies = ["flask"]

[project.optional-dependencies]
dev = ["pytest"]

[tool.pytest.ini_options]
testpaths = ["tests"]
`);
    writeFile(projectDir, "app/__init__.py", "from flask import Flask\n\n\ndef create_app():\n    app = Flask(__name__)\n\n    @app.get(\"/\")\n    def index():\n        return {\"status\": \"ok\", \"service\": \"agentkick\"}\n\n    return app\n");
    writeFile(projectDir, "wsgi.py", "from app import create_app\n\napp = create_app()\n");
    writeFile(projectDir, "tests/test_app.py", "from app import create_app\n\n\ndef test_index():\n    app = create_app()\n    client = app.test_client()\n    response = client.get(\"/\")\n    assert response.status_code == 200\n    assert response.json[\"status\"] == \"ok\"\n");
  }

  if (profile.template === "laravel") {
    writeFile(projectDir, "composer.json", json({
      name: `${profile.name}/app`,
      description: "Laravel app scaffold metadata generated by AgentKick.",
      type: "project",
      require: {
        php: "^8.2",
        "laravel/framework": "^12.0"
      },
      scripts: {
        test: "php artisan test"
      }
    }));
    writeFile(projectDir, "artisan", "#!/usr/bin/env php\n<?php\n\necho \"Install Laravel dependencies or replace this placeholder with a full Laravel app.\\n\";\n");
    writeFile(projectDir, "routes/web.php", "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::get('/', function () {\n    return ['status' => 'ok', 'service' => 'agentkick'];\n});\n");
    writeFile(projectDir, "tests/Feature/HealthTest.php", "<?php\n\ntest('application returns ok', function () {\n    $response = $this->get('/');\n    $response->assertOk();\n});\n");
  }

  if (profile.template === "go-cli") {
    writeFile(projectDir, "go.mod", `module ${goModuleName(profile.name)}

go 1.23
`);
    writeFile(projectDir, "main.go", "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(message())\n}\n\nfunc message() string {\n\treturn \"Hello from your AgentKick Go CLI.\"\n}\n");
    writeFile(projectDir, "main_test.go", "package main\n\nimport \"testing\"\n\nfunc TestMessage(t *testing.T) {\n\tif message() == \"\" {\n\t\tt.Fatal(\"message should not be empty\")\n\t}\n}\n");
  }

  if (profile.template === "rust-cli") {
    writeFile(projectDir, "Cargo.toml", `[package]
name = "${profile.name}"
version = "0.1.0"
edition = "2021"

[dependencies]
`);
    writeFile(projectDir, "src/main.rs", "fn main() {\n    println!(\"{}\", message());\n}\n\nfn message() -> &'static str {\n    \"Hello from your AgentKick Rust CLI.\"\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn message_is_not_empty() {\n        assert!(!message().is_empty());\n    }\n}\n");
  }

  if (profile.template === "electron") {
    writeFile(projectDir, "package.json", json({
      name: profile.name,
      version: "0.1.0",
      type: "module",
      main: "src/main.js",
      scripts: {
        dev: "electron .",
        check: "node --check src/main.js && node --check src/preload.js && node --check src/renderer.js",
        test: "npm run check",
        build: "npm run check"
      },
      devDependencies: {
        electron: "latest"
      }
    }));
    writeFile(projectDir, "src/main.js", "import { app, BrowserWindow } from 'electron';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\nfunction createWindow() {\n  const window = new BrowserWindow({\n    width: 980,\n    height: 680,\n    webPreferences: {\n      preload: path.join(__dirname, 'preload.js')\n    }\n  });\n  window.loadFile(path.join(__dirname, 'index.html'));\n}\n\napp.whenReady().then(createWindow);\napp.on('window-all-closed', () => {\n  if (process.platform !== 'darwin') app.quit();\n});\n");
    writeFile(projectDir, "src/preload.js", "window.addEventListener('DOMContentLoaded', () => {\n  document.body.dataset.agentkick = 'ready';\n});\n");
    writeFile(projectDir, "src/renderer.js", "document.querySelector('#status').textContent = 'AgentKick desktop app ready.';\n");
    writeFile(projectDir, "src/index.html", "<!doctype html>\n<html>\n  <head>\n    <meta charset=\"utf-8\">\n    <title>AgentKick Electron</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n  </head>\n  <body>\n    <main>\n      <h1>AgentKick Electron App</h1>\n      <p id=\"status\">Loading...</p>\n    </main>\n    <script type=\"module\" src=\"renderer.js\"></script>\n  </body>\n</html>\n");
    writeFile(projectDir, "src/styles.css", "body { margin: 0; font-family: Georgia, serif; background: #101820; color: #f8f0df; }\nmain { min-height: 100vh; display: grid; place-content: center; padding: 32px; }\nh1 { font-size: 52px; margin: 0 0 12px; }\n");
  }

  writeFile(projectDir, "README.md", readmeFor(profile));
  writeFile(projectDir, ".gitignore", gitignoreFor(profile));
}

function writeAgentFiles(cwd, profile) {
  writeFile(cwd, "AGENTS.md", agentsMd(profile));
  writeFile(cwd, "CLAUDE.md", claudeMd(profile));
  writeFile(cwd, ".github/copilot-instructions.md", copilotInstructions(profile));
  writeFile(cwd, ".cursor/rules/agentkick.mdc", cursorRules(profile));
  writeFile(cwd, ".agentkick.json", json({
    schemaVersion: 1,
    name: profile.name,
    stack: profile.stack,
    packageManager: profile.packageManager,
    testCommand: profile.testCommand,
    buildCommand: profile.buildCommand,
    launchTarget: profile.launchTarget,
    packs: ["core"]
  }));
}

function writePack(cwd, pack, profile) {
  if (pack === "core") {
    writeClaudeCommand(cwd, "review", "Review the current changes like a senior engineer. Prioritize bugs, regressions, missing tests, security risks, and unclear behavior. Use file and line references where possible.");
    writeClaudeCommand(cwd, "write-tests", `Add or update tests for the current change. Use this project's documented test command: ${profile.testCommand}. If no test harness exists, explain the smallest practical test setup before adding dependencies.`);
    writeClaudeCommand(cwd, "fix-ci", "Inspect the failing CI or local command output, identify the smallest root-cause fix, apply it, and rerun the relevant verification command.");
    writeClaudeCommand(cwd, "explain-codebase", "Explain this codebase for a new maintainer. Cover entry points, important directories, commands, deploy path, and risk areas.");
    writeClaudeAgent(cwd, "code-reviewer", "Use this agent for code review, PR review, regression analysis, and quality checks.", "You are a strict code reviewer. Findings come first. Focus on behavioral bugs, regressions, missing tests, security issues, and deploy risks. Do not summarize unless findings are complete.");
  }

  if (pack === "chrome-extension") {
    writeClaudeCommand(cwd, "chrome-extension-check", "Review the Chrome extension for manifest issues, popup sizing, service worker lifecycle bugs, unsafe permissions, content-script mistakes, and packaging readiness.");
    writeClaudeAgent(cwd, "chrome-extension-engineer", "Use this agent for Chrome extension popup, background service worker, manifest, content script, and Web Store packaging work.", "You are a Chrome extension engineer. Preserve least-privilege permissions, verify popup viewport behavior, avoid exposing secrets, and check manifest v3 service worker constraints.");
  }

  if (pack === "nextjs") {
    writeClaudeCommand(cwd, "nextjs-audit", "Audit the Next.js app for routing, server/client component boundaries, accessibility, metadata, bundle risks, and build failures.");
    writeClaudeAgent(cwd, "nextjs-engineer", "Use this agent for Next.js app router, React UI, data loading, and deployment issues.", "You are a Next.js engineer. Respect existing component patterns, keep server/client boundaries clear, and run type/build checks after changes.");
  }

  if (pack === "netlify") {
    writeClaudeCommand(cwd, "debug-netlify-deploy", "Debug the Netlify deploy path. Check netlify.toml, publish directory, build command, environment variables, redirects, and whether the deploy ran from the correct working directory.");
    writeFile(cwd, "docs/launch-checklist.md", launchChecklist(profile));
  }

  if (pack === "security") {
    writeClaudeCommand(cwd, "security-scan", "Perform a practical security review. Focus on secrets, auth bypass, injection, dependency risks, unsafe MCP config, exposed admin surfaces, and user-data handling.");
    writeClaudeAgent(cwd, "security-auditor", "Use this agent for security review and threat modeling.", "You are a security auditor. Validate exploitability before escalating severity. Prefer concrete attack paths and precise remediation.");
  }

  if (pack === "python") {
    writeClaudeCommand(cwd, "python-api-check", "Review the Python API for dependency hygiene, route behavior, validation, error handling, test coverage, and production server readiness.");
    writeClaudeAgent(cwd, "python-api-engineer", "Use this agent for FastAPI, Flask, Python packaging, pytest, and API deployment work.", "You are a Python API engineer. Keep dependencies minimal, prefer pytest for verification, validate request/response behavior, and avoid leaking secrets through logs or config.");
  }

  if (pack === "php") {
    writeClaudeCommand(cwd, "php-laravel-check", "Review the PHP/Laravel app for routing, validation, migrations, auth, config caching, queue behavior, and test coverage.");
    writeClaudeAgent(cwd, "laravel-engineer", "Use this agent for Laravel, Composer, Artisan, routing, migrations, and PHP test workflows.", "You are a Laravel engineer. Preserve framework conventions, avoid editing generated vendor files, check migrations carefully, and verify with php artisan test when available.");
  }

  if (pack === "go") {
    writeClaudeCommand(cwd, "go-check", "Review the Go project for package layout, error handling, concurrency risks, CLI behavior, test coverage, and release readiness.");
    writeClaudeAgent(cwd, "go-engineer", "Use this agent for Go CLI, API, module, testing, and release work.", "You are a Go engineer. Keep APIs small, return explicit errors, prefer table-driven tests, and verify with go test ./... before shipping.");
  }

  if (pack === "rust") {
    writeClaudeCommand(cwd, "rust-check", "Review the Rust project for ownership issues, error handling, CLI behavior, unsafe code, tests, and release readiness.");
    writeClaudeAgent(cwd, "rust-engineer", "Use this agent for Rust CLI, crates, tests, and release work.", "You are a Rust engineer. Avoid unsafe code unless justified, prefer clear Result-based errors, keep dependencies lean, and verify with cargo test.");
  }

  if (pack === "electron") {
    writeClaudeCommand(cwd, "electron-check", "Review the Electron app for main/preload/renderer boundaries, context isolation, IPC safety, packaging, auto-update risks, and desktop UX.");
    writeClaudeAgent(cwd, "electron-engineer", "Use this agent for Electron desktop apps, preload scripts, IPC, renderer UI, and packaging work.", "You are an Electron engineer. Keep Node access out of the renderer, use preload boundaries carefully, avoid broad IPC channels, and verify syntax before packaging.");
  }

  if (pack === "github") {
    writeFile(cwd, ".github/workflows/agentkick-check.yml", "name: AgentKick Check\n\non:\n  pull_request:\n  push:\n    branches: [main]\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm install\n      - run: npm test\n");
    writeFile(cwd, ".github/ISSUE_TEMPLATE/bug_report.md", "---\nname: Bug report\nabout: Report a reproducible problem\n---\n\n## Problem\n\n## Steps to reproduce\n\n## Expected behavior\n\n## Logs or screenshots\n");
  }

  updateAgentkickConfig(cwd, { addedPacks: [pack] });
}

function agentsMd(profile) {
  return `# AGENTS.md

## Project

${profile.name} is a ${profile.stack.join(", ") || "generic"} project prepared with AgentKick.

## Agent Operating Rules

- Understand the current code path before editing.
- Prefer small, reviewable changes over broad rewrites.
- Do not introduce secrets into committed files.
- Preserve existing user changes and do not revert unrelated work.
- After code edits, run the narrowest useful verification command.
- If verification cannot run, state the exact blocker.

## Commands

- Package manager: ${profile.packageManager}
- Test: ${profile.testCommand}
- Build: ${profile.buildCommand}
- Launch target: ${profile.launchTarget}

## Stack Notes

${stackNotes(profile).map((note) => `- ${note}`).join("\n")}
`;
}

function claudeMd(profile) {
  return `# CLAUDE.md

This repository is configured for Claude Code.

## How To Work Here

- Start by reading \`AGENTS.md\`.
- Use project commands from \`.claude/commands\` when they match the task.
- Use specialist agents from \`.claude/agents\` for review, security, frontend, deploy, or stack-specific work.
- Keep final answers concise and include verification status.

## Project Facts

- Name: ${profile.name}
- Stack: ${profile.stack.join(", ") || "generic"}
- Test command: ${profile.testCommand}
- Build command: ${profile.buildCommand}
- Launch target: ${profile.launchTarget}
`;
}

function copilotInstructions(profile) {
  return `# GitHub Copilot Instructions

Follow the repository rules in \`AGENTS.md\`.

- Keep changes small and consistent with the detected stack: ${profile.stack.join(", ") || "generic"}.
- Prefer existing scripts over new tooling.
- Do not add dependencies unless the task clearly requires them.
- Verify with: ${profile.testCommand}
`;
}

function cursorRules(profile) {
  return `---
description: AgentKick repo rules
alwaysApply: true
---

# AgentKick Rules

Read AGENTS.md before making broad edits.

- Stack: ${profile.stack.join(", ") || "generic"}
- Test command: ${profile.testCommand}
- Build command: ${profile.buildCommand}
- Avoid secrets in source code.
- Preserve existing style and architecture unless asked to redesign.
`;
}

function stackNotes(profile) {
  const notes = [];
  if (profile.stack.includes("chrome-extension")) {
    notes.push("Chrome extension: preserve least-privilege manifest permissions and verify popup behavior in a constrained viewport.");
  }
  if (profile.stack.includes("nextjs")) {
    notes.push("Next.js: keep server/client component boundaries explicit and run a production build before shipping.");
  }
  if (profile.stack.includes("netlify")) {
    notes.push("Netlify: verify publish directory and build command from the site root before deploying.");
  }
  if (profile.stack.includes("docker")) {
    notes.push("Docker: avoid changing exposed ports, volumes, or environment contracts without documenting migration impact.");
  }
  if (profile.stack.includes("python")) {
    notes.push("Python: prefer existing dependency and formatting tools detected in the repo, and verify API behavior with pytest when available.");
  }
  if (profile.stack.includes("fastapi")) {
    notes.push("FastAPI: validate route schemas, status codes, and production server settings before shipping.");
  }
  if (profile.stack.includes("flask")) {
    notes.push("Flask: keep app factory patterns clean and avoid storing secrets in config defaults.");
  }
  if (profile.stack.includes("laravel")) {
    notes.push("Laravel: preserve framework conventions, review migrations carefully, and verify with php artisan test.");
  }
  if (profile.stack.includes("go")) {
    notes.push("Go: prefer explicit errors, table-driven tests, and go test ./... before releases.");
  }
  if (profile.stack.includes("rust")) {
    notes.push("Rust: avoid unsafe code unless justified and verify with cargo test before releases.");
  }
  if (profile.stack.includes("electron")) {
    notes.push("Electron: keep main, preload, and renderer boundaries strict; avoid broad IPC or Node access in renderer code.");
  }
  if (notes.length === 0) {
    notes.push("Generic: document missing commands before assuming test, build, or deploy behavior.");
  }
  return notes;
}

function readmeFor(profile) {
  return `# ${titleize(profile.name)}

Generated with AgentKick.

## AI-Agent Ready

This repo includes:

- \`AGENTS.md\` for Codex and other coding agents
- \`CLAUDE.md\` for Claude Code
- \`.claude/commands\` reusable agent workflows
- \`.claude/agents\` specialist agents
- \`.cursor/rules\` for Cursor
- \`.github/copilot-instructions.md\` for GitHub Copilot

## Commands

\`\`\`bash
${profile.testCommand}
${profile.buildCommand}
\`\`\`

## AgentKick

\`\`\`bash
agentkick doctor
agentkick add security
\`\`\`
`;
}

function launchChecklist(profile) {
  return `# Launch Checklist

- Confirm the product promise is clear in README or landing page.
- Run verification: \`${profile.testCommand}\`.
- Run build: \`${profile.buildCommand}\`.
- Check secrets are not committed.
- Check deploy root is correct.
- Tag a release after the first working public version.
- Add screenshots or a short demo GIF before asking for stars.
`;
}

function writeClaudeCommand(cwd, name, body) {
  writeFile(cwd, `.claude/commands/${name}.md`, `---
description: ${sentenceCase(name)}
---

${body}
`);
}

function writeClaudeAgent(cwd, name, description, body) {
  writeFile(cwd, `.claude/agents/${name}.md`, `---
name: ${name}
description: ${description}
---

${body}
`);
}

function updateAgentkickConfig(cwd, patch) {
  const file = path.join(cwd, ".agentkick.json");
  const current = readJsonSafe(file) ?? {};
  const packs = new Set([...(current.packs ?? []), ...(patch.addedPacks ?? [])]);
  current.packs = [...packs].sort();
  writeAbsoluteFile(file, json(current));
}

function fileCheck(cwd, relativePath, label) {
  const fullPath = path.join(cwd, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, label, message: `missing ${relativePath}` };
  }
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim().length < 40) {
    return { ok: false, label, message: `${relativePath} looks too small` };
  }
  return { ok: true, label, message: relativePath };
}

function findRiskyMcp(cwd) {
  const warnings = [];
  for (const fileName of [".mcp.json", "mcp.json"]) {
    const fullPath = path.join(cwd, fileName);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const content = fs.readFileSync(fullPath, "utf8");
    if (content.includes("C:\\\\") || content.includes("/") && content.includes("filesystem")) {
      warnings.push(`${fileName} may allow broad filesystem access. Restrict it to this repo if possible.`);
    }
  }
  return warnings;
}

function hasDependency(packageJson, dependency) {
  return Boolean(packageJson?.dependencies?.[dependency] || packageJson?.devDependencies?.[dependency]);
}

function packageManagerCommand(cwd) {
  const files = listTopLevelFiles(cwd);
  if (files.has("pnpm-lock.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  return "npm";
}

function listTopLevelFiles(cwd) {
  try {
    return new Set(fs.readdirSync(cwd));
  } catch {
    return new Set();
  }
}

function existsAny(cwd, candidates) {
  return candidates.some((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

function hasText(file, text) {
  try {
    return fs.readFileSync(file, "utf8").includes(text);
  } catch {
    return false;
  }
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeFile(cwd, relativePath, content) {
  writeAbsoluteFile(path.join(cwd, relativePath), content);
}

function writeAbsoluteFile(file, content) {
  ensureDir(path.dirname(file));
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, "utf8");
    if (existing === content) {
      return;
    }
  }
  fs.writeFileSync(file, content, "utf8");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function gitignoreFor(profile) {
  const common = [".DS_Store", ".env", ".env.local", "dist/", "build/"];
  const byStack = [];
  if (profile.stack.some((item) => ["javascript", "typescript", "nextjs", "electron", "node-cli"].includes(item))) {
    byStack.push("node_modules/", ".next/", "out/");
  }
  if (profile.stack.includes("python")) {
    byStack.push(".venv/", "__pycache__/", "*.pyc", ".pytest_cache/");
  }
  if (profile.stack.includes("php") || profile.stack.includes("laravel")) {
    byStack.push("vendor/", "storage/logs/*.log", ".phpunit.result.cache");
  }
  if (profile.stack.includes("go")) {
    byStack.push("*.test", "coverage.out");
  }
  if (profile.stack.includes("rust")) {
    byStack.push("target/");
  }
  return `${[...new Set([...common, ...byStack])].join("\n")}\n`;
}

function goModuleName(name) {
  return name.replace(/[^a-zA-Z0-9/_-]/g, "-").replace(/^-+|-+$/g, "") || "agentkick-app";
}

function titleize(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sentenceCase(value) {
  return value.replace(/-/g, " ");
}
