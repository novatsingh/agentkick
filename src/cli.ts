import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { Command } from "commander";
import { writeAgentFiles } from "./agent-files.js";
import { SUPPORTED_PACKS, SUPPORTED_TEMPLATES, VERSION } from "./constants.js";
import { runDoctor } from "./doctor.js";
import { setWriteMode } from "./fs-utils.js";
import { writePack } from "./packs.js";
import { buildProfile, defaultPacksForTemplate, detectProject } from "./profile.js";
import { writeTemplateProject } from "./templates.js";
import type { DoctorOptions, Pack, ProjectProfile, Template } from "./types.js";

type GlobalOptions = {
  dryRun?: boolean;
};

export function createProgram(cwd = process.cwd()) {
  const program = new Command();

  program
    .name("agentkick")
    .description("Workflow infrastructure for AI-assisted software development.")
    .version(VERSION, "-v, --version")
    .option("--dry-run", "show file operations without writing");

  program
    .command("init")
    .description("Initialize AgentKick memory, agent instructions, and repo workflow files.")
    .option("--dry-run", "show file operations without writing")
    .action((options: GlobalOptions) => {
      applyWriteMode(program, options);
      initExistingProject(cwd, options);
    });

  program
    .command("doctor")
    .description("Check AI workflow readiness and stack detection.")
    .option("--strict", "exit non-zero when readiness is blocked or below threshold")
    .option("--json", "print JSON output")
    .option("--debug", "print stack detection reasoning")
    .action((options: DoctorOptions) => {
      runDoctor(cwd, options);
    });

  program
    .command("focus")
    .description("Print the minimal project context an agent should load before editing.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action((scope?: string) => {
      printFocus(cwd, scope);
    });

  program
    .command("summarize")
    .description("Summarize the current repo for handoff or thread reset.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action((scope?: string) => {
      printSummary(cwd, scope);
    });

  program
    .command("new")
    .description("Create a new agent-ready project from a supported template.")
    .argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`)
    .argument("[project-name]", "project folder name")
    .action(async (template?: string, projectName?: string) => {
      applyWriteMode(program);
      await createNewProject({ template, projectName, cwd, options: program.opts<GlobalOptions>() });
    });

  program
    .command("add")
    .description("Add an AgentKick command/skill pack.")
    .argument("<pack>", `pack: ${SUPPORTED_PACKS.join(", ")}`)
    .action((pack: string) => {
      applyWriteMode(program);
      addPack(cwd, pack, program.opts<GlobalOptions>());
    });

  return program;
}

export async function run(argv: string[], cwd = process.cwd()) {
  const program = createProgram(cwd);
  await program.parseAsync(argv, { from: "user" });
}

async function createNewProject(input: {
  template?: string;
  projectName?: string;
  cwd: string;
  options: GlobalOptions;
}) {
  let template = input.template;
  let projectName = input.projectName;

  if (!template || !projectName) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("usage: agentkick new <template> <project-name>");
    }
    ({ template, projectName } = await promptForNewProject({ template, projectName }));
  }

  if (!isTemplate(template)) {
    throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
  }

  const projectDir = path.resolve(input.cwd, projectName);
  if (fs.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);

  const defaultPacks = defaultPacksForTemplate(template);
  const profile: ProjectProfile = { ...buildProfile(template, projectName), packs: ["core", ...defaultPacks] };
  writeTemplateProject(projectDir, profile);
  writeAgentFiles(projectDir, profile);
  writePack(projectDir, "core", profile, { updateConfig: false });
  for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });

  console.log(`Created ${projectName} using ${template}.`);
  if (input.options.dryRun) console.log("Dry run only. No files were written.");
  console.log("Next steps:");
  console.log(`  cd ${projectName}`);
  console.log("  agentkick doctor");
}

function initExistingProject(cwd: string, options: GlobalOptions) {
  const profile = detectProject(cwd);
  writeAgentFiles(cwd, profile);
  writePack(cwd, "core", profile);
  console.log(`Initialized AI-agent setup for ${profile.name}.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
  printDetectionSummary(profile);
}

function addPack(cwd: string, pack: string, options: GlobalOptions) {
  if (!isPack(pack)) throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);

  const profile = detectProject(cwd);
  writePack(cwd, pack, profile);
  console.log(`Added ${pack} pack.`);
  if (options.dryRun) console.log("Dry run only. No files were written.");
}

function printFocus(cwd: string, scope?: string) {
  const profile = detectProject(cwd);
  const stack = profile.primaryStack ?? profile.template;
  const scopeLabel = scope ?? "current task";
  const candidates = ["AGENTS.md", "CLAUDE.md", ".agentkick.json", "package.json", "README.md", scope].filter(
    (item): item is string => Boolean(item)
  );

  console.log("AgentKick focus");
  console.log("");
  console.log(`Scope: ${scopeLabel}`);
  console.log(`Detected stack: ${stack}`);
  if (profile.capabilities?.length) console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  console.log("");
  console.log("Load first:");
  for (const item of uniqueExisting(cwd, candidates)) console.log(`- ${item}`);
  console.log("");
  console.log("Working rule: keep the agent context limited to the scope, touched files, and repo memory above.");
}

function printSummary(cwd: string, scope?: string) {
  const profile = detectProject(cwd);
  console.log("AgentKick summary");
  console.log("");
  console.log(`Project: ${profile.name}`);
  if (scope) console.log(`Scope: ${scope}`);
  console.log(`Stack: ${profile.primaryStack ?? profile.template}`);
  if (profile.capabilities?.length) console.log(`Capabilities: ${profile.capabilities.join(", ")}`);
  console.log(`Package manager: ${profile.packageManager}`);
  console.log(`Test: ${profile.testCommand}`);
  console.log(`Build: ${profile.buildCommand}`);
  console.log("");
  console.log("Recommended next step: run agentkick focus before giving a coding agent a new task.");
}

async function promptForNewProject(defaults: { template?: string; projectName?: string }) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log("AgentKick project setup\n");
    SUPPORTED_TEMPLATES.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
    console.log("");

    const templateAnswer = defaults.template ?? (await rl.question("Project type [1]: "));
    const template = resolveTemplateAnswer(templateAnswer || "1");
    const nameAnswer = defaults.projectName ?? (await rl.question("Project name: "));
    const projectName = sanitizeProjectName(nameAnswer);
    if (!projectName) throw new Error("project name is required");
    return { template, projectName };
  } finally {
    rl.close();
  }
}

function resolveTemplateAnswer(answer: string): Template {
  const normalized = String(answer).trim();
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= SUPPORTED_TEMPLATES.length) {
    return SUPPORTED_TEMPLATES[numeric - 1];
  }
  if (isTemplate(normalized)) return normalized;
  throw new Error(`unknown template "${answer}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);
}

function sanitizeProjectName(name: string) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function printDetectionSummary(profile: ProjectProfile) {
  console.log(`Detected stack: ${profile.primaryStack ?? profile.template ?? "generic"}`);
  if (profile.capabilities?.length) {
    console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  }
  if ((profile.primaryStack ?? profile.template) === "generic") {
    console.log("Could not confidently detect stack. Run agentkick doctor --debug to see checked files.");
    printWorkspaceHints(profile);
  }
}

function applyWriteMode(program: Command, options: GlobalOptions = {}) {
  const globalOptions = program.opts<GlobalOptions>();
  setWriteMode({ dryRun: Boolean(options.dryRun ?? globalOptions.dryRun) });
}

function uniqueExisting(cwd: string, candidates: string[]) {
  return [...new Set(candidates)].filter((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

function isTemplate(value: string): value is Template {
  return SUPPORTED_TEMPLATES.includes(value as Template);
}

function isPack(value: string): value is Pack {
  return SUPPORTED_PACKS.includes(value as Pack);
}

function printWorkspaceHints(profile: ProjectProfile) {
  const hints = profile.detection?.workspaceHints ?? [];
  if (hints.length === 0) return;

  console.log("");
  console.log("This looks like a workspace folder, not a single app repo.");
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of hints.slice(0, 5)) {
    console.log(`  cd ${hint.path}  # ${hint.stack}`);
  }
}
