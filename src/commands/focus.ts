import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { detectProject } from "../detectors/project-detector.js";
import type { CommandContext } from "../core/program.js";
import { formatStack } from "../utils/format.js";

export function registerFocusCommand(program: Command, context: CommandContext) {
  program
    .command("focus")
    .description("Print the minimal project context an agent should load before editing.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action((scope?: string) => {
      const profile = detectProject(context.cwd);
      const candidates = ["AGENTS.md", "CLAUDE.md", ".agentkick.json", "package.json", "README.md", scope].filter(
        (item): item is string => Boolean(item)
      );

      console.log("AgentKick focus");
      console.log("");
      console.log(`Scope: ${scope ?? "current task"}`);
      console.log(`Detected stack: ${formatStack(profile)}`);
      if (profile.capabilities?.length) console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
      console.log("");
      console.log("Load first:");
      for (const item of uniqueExisting(context.cwd, candidates)) console.log(`- ${item}`);
      console.log("");
      console.log("Working rule: keep the agent context limited to the scope, touched files, and repo memory above.");
    });
}

function uniqueExisting(cwd: string, candidates: string[]) {
  return [...new Set(candidates)].filter((candidate) => fs.existsSync(path.join(cwd, candidate)));
}
