import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildWorkflowSummary, renderSummary } from "../workflow/memory.js";
import { applyWriteMode, type GlobalOptions } from "./shared.js";

type SummarizeOptions = GlobalOptions & {
  task?: string;
  handoff?: boolean;
  status?: "complete" | "blocked" | "handoff";
};

export function registerSummarizeCommand(program: Command, context: CommandContext) {
  program
    .command("summarize")
    .description("Compress workflow state for handoff or a fresh chat.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .option("--task <task>", "task description to record in memory")
    .option("--status <status>", "summary status: complete, blocked, or handoff")
    .option("--handoff", "produce a short paste-ready handoff for a fresh chat")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick summarize
  $ agentkick summarize --task "Improve README positioning"
  $ agentkick summarize --task "Improve README positioning" --handoff
  $ agentkick summarize auth
`
    )
    .action(async (scope: string | undefined, options: SummarizeOptions) => {
      applyWriteMode(program, options);
      console.log(
        renderSummary(
          await buildWorkflowSummary(context.cwd, {
            scope,
            task: options.task,
            handoff: options.handoff,
            status: options.status
          })
        )
      );
    });
}
