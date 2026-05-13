import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { z } from "zod";
import { SUPPORTED_TEMPLATES } from "../core/constants.js";
import type { ProjectProfile, Template } from "../core/types.js";
import { buildProfile, defaultPacksForTemplate } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { writeAgentFiles } from "../templates/agent-files.js";
import { postInstallStepsFor, templateChoices, writeTemplateProject } from "../templates/project-templates.js";
import { createSpinner, logger } from "../utils/logger.js";
import { header, keyValue, nextSteps, pathLabel } from "../utils/ui.js";
import { writePack } from "../workflow/packs.js";
import { applyWriteMode, isDryRun } from "./shared.js";

const ProjectNameSchema = z
  .string()
  .min(1, "project name is required")
  .regex(/^[a-z0-9._-]+$/, "project name may only contain lowercase letters, numbers, dots, underscores, and dashes")
  .refine((value) => value !== "." && value !== "..", "project name cannot be . or ..");

export function registerNewCommand(program: Command, context: CommandContext) {
  program
    .command("new")
    .description("Create an AI-workflow-ready project from a template.")
    .argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`)
    .argument("[project-name]", "project folder name")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick new ai-saas myapp
  $ agentkick new chrome-extension browser-helper
  $ agentkick new marketplace vendorhub
`
    )
    .action(async (template?: string, projectName?: string) => {
      applyWriteMode(program);
      const resolvedTemplate = await resolveTemplate(template);
      const resolvedName = sanitizeProjectName(projectName ?? (await input({ message: "Project name:" })));
      const validation = ProjectNameSchema.safeParse(resolvedName);
      if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "invalid project name");

      const projectDir = path.resolve(context.cwd, resolvedName);
      if (fs.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);

      const defaultPacks = defaultPacksForTemplate(resolvedTemplate);
      const profile: ProjectProfile = {
        ...buildProfile(resolvedTemplate, resolvedName),
        packs: ["core", ...defaultPacks]
      };
      const spinner = isDryRun(program) ? null : createSpinner("Generating project files").start();
      try {
        writeTemplateProject(projectDir, profile);
        writeAgentFiles(projectDir, profile, { includeWorkflowMemory: false });
        writePack(projectDir, "core", profile, { updateConfig: false });
        for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });
        spinner?.succeed("Project files generated");
      } catch (error) {
        spinner?.fail("Project generation failed");
        throw error;
      }

      console.log(header("AgentKick project created", "AI workflow memory and agent instructions are ready."));
      console.log("");
      logger.success(`${resolvedName} created`);
      console.log(keyValue("Template", resolvedTemplate));
      console.log(keyValue("Location", pathLabel(projectDir)));
      console.log("");
      console.log(nextSteps([`cd ${resolvedName}`, ...postInstallStepsFor(resolvedTemplate)]));
    });
}

async function resolveTemplate(template?: string): Promise<Template> {
  const normalized = normalizeTemplate(template);
  if (normalized && isTemplate(normalized)) return normalized;
  if (template) throw new Error(`unknown template "${template}". Supported: ${SUPPORTED_TEMPLATES.join(", ")}`);

  return select({
    message: "Select project type:",
    choices: templateChoices()
  });
}

function isTemplate(value: string): value is Template {
  return SUPPORTED_TEMPLATES.includes(value as Template);
}

function sanitizeProjectName(name: string) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTemplate(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-");
}
