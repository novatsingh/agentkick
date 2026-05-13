import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildWorkflowSummary, renderSummary } from "../workflow/memory.js";

export function registerSummarizeCommand(program: Command, context: CommandContext) {
  program
    .command("summarize")
    .description("Summarize the current repo for handoff or thread reset.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action(async (scope?: string) => {
      console.log(renderSummary(await buildWorkflowSummary(context.cwd, scope)));
    });
}
