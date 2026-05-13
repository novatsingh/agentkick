import type { Command } from "commander";
import { writeAgentFiles } from "../templates/agent-files.js";
import { printDetectionSummary } from "../utils/format.js";
import { createSpinner, logger } from "../utils/logger.js";
import { header, keyValue, nextSteps } from "../utils/ui.js";
import { writePack } from "../workflow/packs.js";
import { writeInitialWorkflowState } from "../workflow/memory.js";
import { detectProject } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { applyWriteMode, isDryRun, type GlobalOptions } from "./shared.js";

export function registerInitCommand(program: Command, context: CommandContext) {
  program
    .command("init")
    .description("Initialize workflow memory and agent instructions in the current repo.")
    .option("--dry-run", "show file operations without writing")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick init
  $ agentkick init --dry-run
`
    )
    .action((options: GlobalOptions) => {
      applyWriteMode(program, options);
      const profile = detectProject(context.cwd);
      const spinner = isDryRun(program, options) ? null : createSpinner("Writing workflow memory").start();
      try {
        writeAgentFiles(context.cwd, profile);
        writeInitialWorkflowState(context.cwd, profile);
        writePack(context.cwd, "core", profile);
        spinner?.succeed("Workflow memory written");
      } catch (error) {
        spinner?.fail("Initialization failed");
        throw error;
      }
      console.log(header("AgentKick initialized", "Workflow memory is now repo-native."));
      console.log("");
      logger.success(`initialized ${profile.name}`);
      console.log(keyValue("Project", profile.name));
      console.log(keyValue("Package manager", profile.packageManager));
      if (options.dryRun) logger.muted("Dry run only. No files were written.");
      printDetectionSummary(profile);
      console.log("");
      console.log(nextSteps(["agentkick doctor", "agentkick focus <scope>", "agentkick summarize"]));
    });
}
