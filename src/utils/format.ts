import chalk from "chalk";
import type { ProjectProfile, WorkspaceHint } from "../core/types.js";

export function formatStack(profile: ProjectProfile) {
  return profile.primaryStack ?? profile.template ?? "generic";
}

export function printDetectionSummary(profile: ProjectProfile) {
  console.log(`Detected stack: ${chalk.bold(formatStack(profile))}`);
  if (profile.capabilities?.length) {
    console.log(`Detected capabilities: ${profile.capabilities.join(", ")}`);
  }
  if (formatStack(profile) === "generic") {
    console.log(chalk.yellow("Could not confidently detect stack. Run agentkick doctor --debug to see checked files."));
    printWorkspaceHints(profile.detection?.workspaceHints ?? []);
  }
}

export function printWorkspaceHints(hints: WorkspaceHint[]) {
  if (hints.length === 0) return;

  console.log("");
  console.log(chalk.yellow("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of hints.slice(0, 5)) {
    console.log(`  ${chalk.cyan(`cd ${hint.path}`)}  ${chalk.gray(`# ${hint.stack}`)}`);
  }
}
