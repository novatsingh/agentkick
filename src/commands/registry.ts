import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { registerAddCommand } from "./add.js";
import { registerDoctorCommand } from "./doctor.js";
import { registerFocusCommand } from "./focus.js";
import { registerInitCommand } from "./init.js";
import { registerNewCommand } from "./new.js";
import { registerSplitTaskCommand } from "./split-task.js";
import { registerSummarizeCommand } from "./summarize.js";

export function registerCommands(program: Command, context: CommandContext) {
  registerInitCommand(program, context);
  registerDoctorCommand(program, context);
  registerFocusCommand(program, context);
  registerSplitTaskCommand(program, context);
  registerSummarizeCommand(program, context);
  registerNewCommand(program, context);
  registerAddCommand(program, context);
}
