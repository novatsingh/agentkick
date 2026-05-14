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
    .description("Repo-native workflow memory for AI-assisted development.")
    .version(VERSION, "-v, --version")
    .option("--dry-run", "show file operations without writing")
    .showHelpAfterError()
    .showSuggestionAfterError()
    .addHelpText(
      "after",
      `

Examples:
  $ agentkick init
  $ agentkick doctor --debug
  $ agentkick focus auth
  $ agentkick split-task "add paid checkout"
  $ agentkick summarize
  $ agentkick new ai-saas myapp
  $ agentkick new electron-app desktop-studio

Workflow:
  init       write repo memory and agent instructions
  doctor     check AI workflow readiness
  focus      create scoped task context
  split-task break broad requests into scoped chunks
  summarize  compress current state for a fresh chat
`
    );

  registerCommands(program, context);
  return program;
}

export async function run(argv: string[], cwd = process.cwd()) {
  const program = createProgram(cwd);
  await program.parseAsync(argv, { from: "user" });
}
