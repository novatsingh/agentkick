import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { buildFocusContext, renderFocus } from "../workflow/memory.js";
import { applyWriteMode, type GlobalOptions } from "./shared.js";

type FocusOptions = GlobalOptions & {
  files?: string[];
  feature?: string;
  task?: string;
};

export function registerFocusCommand(program: Command, context: CommandContext) {
  program
    .command("focus")
    .description("Generate scoped task context and update workflow state.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .option("--files <paths...>", "explicit task files or folders to use as scope")
    .option("--feature <name>", "feature name to focus")
    .option("--task <task>", "task description to turn into an agent brief")
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick focus auth
  $ agentkick focus --feature billing
  $ agentkick focus --task "Improve README positioning"
  $ agentkick focus --files README.md package.json
  $ agentkick focus checkout
  $ agentkick focus "fix popup button"
`
    )
    .action((scope: string | undefined, options: FocusOptions) => {
      applyWriteMode(program, options);
      console.log(
        renderFocus(
          buildFocusContext(context.cwd, {
            scope,
            files: options.files,
            feature: options.feature,
            task: options.task
          })
        )
      );
    });
}
