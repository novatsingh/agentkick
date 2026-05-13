import { run } from "./core/program.js";
import { errorMessage, hint } from "./utils/ui.js";

run(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(errorMessage(message));
  const suggestion = suggestionFor(message);
  if (suggestion) console.error(hint(suggestion));
  process.exitCode = 1;
});

function suggestionFor(message: string) {
  if (message.includes("unknown template")) return "Run agentkick new --help to see supported project templates.";
  if (message.includes("unknown pack")) return "Run agentkick add --help to see supported workflow packs.";
  if (message.includes("target folder already exists"))
    return "Choose a new project name or remove the existing folder.";
  if (message.includes("project name is required")) return "Run agentkick new <template> <project-name>.";
  return "Run agentkick --help for available commands.";
}
