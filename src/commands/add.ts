import type { Command } from "commander";
import { SUPPORTED_PACKS } from "../core/constants.js";
import type { Pack } from "../core/types.js";
import { detectProject } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { logger } from "../utils/logger.js";
import { nextSteps } from "../utils/ui.js";
import { writePack } from "../workflow/packs.js";
import { applyWriteMode } from "./shared.js";

export function registerAddCommand(program: Command, context: CommandContext) {
  program
    .command("add")
    .description("Add focused workflow instructions for a stack or concern.")
    .argument("<pack>", `pack: ${SUPPORTED_PACKS.join(", ")}`)
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick add github
  $ agentkick add security
  $ agentkick add chrome-extension
`
    )
    .action((pack: string) => {
      applyWriteMode(program);
      if (!isPack(pack)) throw new Error(`unknown pack "${pack}". Supported: ${SUPPORTED_PACKS.join(", ")}`);
      const profile = detectProject(context.cwd);
      writePack(context.cwd, pack, profile);
      logger.success(`Added ${pack} pack.`);
      console.log(nextSteps(["git diff", "agentkick doctor"]));
    });
}

function isPack(value: string): value is Pack {
  return SUPPORTED_PACKS.includes(value as Pack);
}
