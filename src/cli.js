import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { writeAgentFiles } from "./agent-files.js";
import { SUPPORTED_PACKS, SUPPORTED_TEMPLATES, VERSION } from "./constants.js";
import { runDoctor } from "./doctor.js";
import { buildProfile, defaultPacksForTemplate, detectProject } from "./profile.js";
import { writePack } from "./packs.js";
import { writeTemplateProject } from "./templates.js";
import { setWriteMode } from "./fs-utils.js";

export async function run(args) {
  const { commandArgs, options } = parseGlobalOptions(args);
  setWriteMode({ dryRun: options.dryRun });
  const command = commandArgs[0] ?? "help";

  if (command === "help" || command === "--help" || command === "-h") return printHelp();
  if (command === "version" || command === "--version" || command === "-v") return console.log(VERSION);
  if (command === "new") return createNewProject(commandArgs.slice(1), options);
  if (command === "init") return initExistingProject(process.cwd(), options);
  if (command === "add") return addPack(process.cwd(), commandArgs.slice(1), options);
  if (command === "doctor") return runDoctor(process.cwd(), parseDoctorOptions(commandArgs.slice(1)));

  throw new Error(`unknown command "${command}". Run "agentkick help".`);
}

function printHelp() {
  console.log(`AgentKick ${VERSION}

Usage:
  agentkick new [template] [project-name]
  agentkick init [--dry-run]
  agentkick add <pack> [--dry-run]
  agentkick doctor [--strict] [--json]

Templates:
  ${SUPPORTED_TEMPLATES.join(", ")}

Packs:
  ${SUPPORTED_PACKS.join(", ")}

Examples:
  agentkick new
  agentkick new chrome-extension browser-helper
  agentkick new fastapi my-api
  agentkick new go-cli my-tool
  cd existing-repo && agentkick init
  agentkick add security
  agentkick doctor --strict`);
}

async function createNewProject(input, options) {
  let template = input[0];
  let projectName = input[1];

  if (!template || !projectName) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("usage: agentkick new <template> <project-name>");
    }
    ({ template, projectName } = await promptForNewProject({ template, projectName }));
  }

  if (!SUPPORTED_TEMPLATES.includes(template)) {
    throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
  }

  const projectDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);

  const profile = buildProfile(template, projectName);
  writeTemplateProject(projectDir, profile);
  writeAgentFiles(projectDir, profile);
  writePack(projectDir, "core", profile);
  for (const pack of defaultPacksForTemplate(template)) writePack(projectDir, pack, profile);

  console.log(`Created ${projectName} using ${template}.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
  console.log("Next steps:");
  console.log(`  cd ${projectName}`);
  console.log("  agentkick doctor");
}

function initExistingProject(cwd, options) {
  const profile = detectProject(cwd);
  writeAgentFiles(cwd, profile);
  writePack(cwd, "core", profile);
  console.log(`Initialized AI-agent setup for ${profile.name}.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
  console.log(`Detected stack: ${profile.stack.join(", ") || "generic"}`);
}

function addPack(cwd, input, options) {
  const pack = input[0];
  if (!pack) throw new Error("usage: agentkick add <pack>");
  if (!SUPPORTED_PACKS.includes(pack)) {
    throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
  }

  const profile = detectProject(cwd);
  writePack(cwd, pack, profile);
  console.log(`Added ${pack} pack.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
}

async function promptForNewProject(defaults) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log("AgentKick project setup\n");
    SUPPORTED_TEMPLATES.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
    console.log("");

    const templateAnswer = defaults.template ?? await rl.question("Project type [1]: ");
    const template = resolveTemplateAnswer(templateAnswer || "1");
    const nameAnswer = defaults.projectName ?? await rl.question("Project name: ");
    const projectName = sanitizeProjectName(nameAnswer);
    if (!projectName) throw new Error("project name is required");
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
  if (SUPPORTED_TEMPLATES.includes(normalized)) return normalized;
  throw new Error(`unknown template "${answer}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
}

function sanitizeProjectName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDoctorOptions(input) {
  return {
    strict: input.includes("--strict"),
    json: input.includes("--json")
  };
}

function parseGlobalOptions(input) {
  const options = {
    dryRun: input.includes("--dry-run")
  };
  return {
    options,
    commandArgs: input.filter((arg) => arg !== "--dry-run")
  };
}
