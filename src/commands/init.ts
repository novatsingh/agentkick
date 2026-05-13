import type { Command } from "commander";
import { writeAgentFiles } from "../templates/agent-files.js";
import { printDetectionSummary } from "../utils/format.js";
import { logger } from "../utils/logger.js";
import { writePack } from "../workflow/packs.js";
import { detectProject } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { applyWriteMode, type GlobalOptions } from "./shared.js";

export function registerInitCommand(program: Command, context: CommandContext) {
  program
    .command("init")
    .description("Initialize AgentKick memory, agent instructions, and repo workflow files.")
    .option("--dry-run", "show file operations without writing")
    .action((options: GlobalOptions) => {
      applyWriteMode(program, options);
      const profile = detectProject(context.cwd);
      writeAgentFiles(context.cwd, profile);
      writePack(context.cwd, "core", profile);
      logger.success(`Initialized AI-agent setup for ${profile.name}.`);
      if (options.dryRun) logger.muted("Dry run only. No files were written.");
      printDetectionSummary(profile);
    });
}
