import type { Command } from "commander";
import { loadConfig } from "../core/config.js";
import type { CommandContext } from "../core/program.js";
import { detectProject } from "../detectors/project-detector.js";
import { formatStack } from "../utils/format.js";
import { gitBranch } from "../utils/git.js";

export function registerSummarizeCommand(program: Command, context: CommandContext) {
  program
    .command("summarize")
    .description("Summarize the current repo for handoff or thread reset.")
    .argument("[scope]", "optional feature, folder, or task scope")
    .action(async (scope?: string) => {
      const profile = detectProject(context.cwd);
      const config = loadConfig(context.cwd);
      const branch = await gitBranch(context.cwd);

      console.log("AgentKick summary");
      console.log("");
      console.log(`Project: ${profile.name}`);
      if (scope) console.log(`Scope: ${scope}`);
      if (branch) console.log(`Git branch: ${branch}`);
      console.log(`Stack: ${formatStack(profile)}`);
      if (profile.capabilities?.length) console.log(`Capabilities: ${profile.capabilities.join(", ")}`);
      console.log(`Package manager: ${profile.packageManager}`);
      console.log(`Test: ${config?.testCommand ?? profile.testCommand}`);
      console.log(`Build: ${config?.buildCommand ?? profile.buildCommand}`);
      console.log("");
      console.log("Recommended next step: run agentkick focus before giving a coding agent a new task.");
    });
}
