import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildWorkflowSummary, renderSummary } from "../workflow/memory.js";

export function registerSummarizeCommand(program: Command, context: CommandContext) {
  program
    .command("summarize")
    .description("Compress workflow state for handoff or a fresh chat.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick summarize
  $ agentkick summarize auth
`
    )
    .action(async (scope?: string) => {
      console.log(renderSummary(await buildWorkflowSummary(context.cwd, scope)));
    });
}
