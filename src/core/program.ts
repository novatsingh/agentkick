import process from "node:process";
import { Command } from "commander";
import { registerCommands } from "../commands/registry.js";
import { VERSION } from "./constants.js";

export type CommandContext = {
  cwd: string;
};

export function createProgram(cwd = process.cwd()) {
  const program = new Command();
  const context: CommandContext = { cwd };

  program
    .name("agentkick")
    .description("Workflow infrastructure for AI-assisted software development.")
    .version(VERSION, "-v, --version")
    .option("--dry-run", "show file operations without writing");

  registerCommands(program, context);
  return program;
}

export async function run(argv: string[], cwd = process.cwd()) {
  const program = createProgram(cwd);
  await program.parseAsync(argv, { from: "user" });
}
