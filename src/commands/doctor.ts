import type { Command } from "commander";
import type { CommandContext } from "../core/program.js";
import { runDoctor } from "../doctor/doctor-engine.js";
import type { DoctorOptions } from "../core/types.js";

export function registerDoctorCommand(program: Command, context: CommandContext) {
  program
    .command("doctor")
    .description("Check AI workflow readiness and stack detection.")
    .option("--strict", "exit non-zero when readiness is blocked or below threshold")
    .option("--json", "print JSON output")
    .option("--debug", "print stack detection reasoning")
    .action((options: DoctorOptions) => {
      runDoctor(context.cwd, options);
    });
}
