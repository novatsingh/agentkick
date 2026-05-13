import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildFocusContext, renderFocus } from "../workflow/memory.js";

export function registerFocusCommand(program: Command, context: CommandContext) {
  program
    .command("focus")
    .description("Print the minimal project context an agent should load before editing.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action((scope?: string) => {
      console.log(renderFocus(buildFocusContext(context.cwd, scope)));
    });
}
