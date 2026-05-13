import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { SUPPORTED_TEMPLATES } from "../core/constants.js";
import type { ProjectProfile, Template } from "../core/types.js";
import { buildProfile, defaultPacksForTemplate } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { writeAgentFiles } from "../templates/agent-files.js";
import { postInstallStepsFor, templateChoices, writeTemplateProject } from "../templates/project-templates.js";
import { logger } from "../utils/logger.js";
import { writePack } from "../workflow/packs.js";
import { applyWriteMode } from "./shared.js";

export function registerNewCommand(program: Command, context: CommandContext) {
  program
    .command("new")
    .description("Create a new agent-ready project from a supported template.")
    .argument("[template]", `template: ${SUPPORTED_TEMPLATES.join(", ")}`)
    .argument("[project-name]", "project folder name")
    .action(async (template?: string, projectName?: string) => {
      applyWriteMode(program);
      const resolvedTemplate = await resolveTemplate(template);
      const resolvedName = sanitizeProjectName(projectName ?? (await input({ message: "Project name:" })));
      if (!resolvedName) throw new Error("project name is required");

      const projectDir = path.resolve(context.cwd, resolvedName);
      if (fs.existsSync(projectDir)) throw new Error(`target folder already exists: ${projectDir}`);

      const defaultPacks = defaultPacksForTemplate(resolvedTemplate);
      const profile: ProjectProfile = {
        ...buildProfile(resolvedTemplate, resolvedName),
        packs: ["core", ...defaultPacks]
      };
      writeTemplateProject(projectDir, profile);
      writeAgentFiles(projectDir, profile, { includeWorkflowMemory: false });
      writePack(projectDir, "core", profile, { updateConfig: false });
      for (const pack of defaultPacks) writePack(projectDir, pack, profile, { updateConfig: false });

      logger.success(`Created ${resolvedName} using ${resolvedTemplate}.`);
      console.log("Next steps:");
      console.log(`  cd ${resolvedName}`);
      for (const step of postInstallStepsFor(resolvedTemplate)) console.log(`  ${step}`);
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
