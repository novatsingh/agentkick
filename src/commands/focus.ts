import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildFocusContext, renderFocus } from "../workflow/memory.js";

export function registerFocusCommand(program: Command, context: CommandContext) {
  program
    .command("focus")
    .description("Generate scoped task context and update workflow state.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick focus auth
  $ agentkick focus checkout
  $ agentkick focus "fix popup button"
`
    )
    .action((scope?: string) => {
      console.log(renderFocus(buildFocusContext(context.cwd, scope)));
    });
}
