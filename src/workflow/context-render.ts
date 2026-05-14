import type { buildFocusContext, buildWorkflowSummary } from "./context.js";
import { bullet, command, header, keyValue, pathLabel, section } from "../utils/ui.js";

export function renderFocus(context: ReturnType<typeof buildFocusContext>) {
  const lines = [
    header("AgentKick focus", "Paste-ready task brief for a coding agent."),
    "",
    section("Task:"),
    context.task,
    "",
    context.feature ? keyValue("Feature", context.feature) : "",
    keyValue("Scope", context.scope),
    keyValue("Detected stack", context.profile.primaryStack ?? context.profile.template),
    context.profile.capabilities?.length
      ? keyValue("Detected capabilities", context.profile.capabilities.join(", "))
      : "",
    "",
    section("Load first:"),
    ...context.loadFirst.map((file) => bullet(pathLabel(file))),
    "",
    section("Task files:"),
    ...(context.scopedFiles.length > 0
      ? context.scopedFiles.map((file) =>
          bullet(`${pathLabel(file.path)} (${file.exists ? `${file.lines} lines` : "not found"}; ${file.reason})`)
        )
      : [bullet("No scoped source files found. Start from the memory files above.")]),
    "",
    section("Avoid paths:"),
    ...context.avoidPaths.map((item) => bullet(pathLabel(item))),
    "",
    section("Known memory files:"),
    ...context.memoryFiles.map((item) => bullet(pathLabel(item))),
    "",
    keyValue("Verification", context.verificationCommand),
    keyValue("Build", context.buildCommand),
    "",
    section("Execution boundaries:"),
    ...context.boundaries.map((boundary) => bullet(boundary)),
    "",
    section("Uncertainty:"),
    ...context.uncertainty.map((item) => bullet(item)),
    "",
    section("Compressed memory:"),
    ...context.memory.map((item) => bullet(item)),
    "",
    section("Agent-ready prompt:"),
    [
      `Task: ${context.task}`,
      `Read first: ${context.loadFirst.join(", ") || "AGENTS.md, WORKFLOW_RULES.md"}.`,
      `Work in task files only: ${context.scopedFiles.map((file) => file.path).join(", ") || "scope not confirmed"}.`,
      `Avoid: ${context.avoidPaths.join(", ")}.`,
      `Verify with: ${context.verificationCommand}.`,
      "Do not copy full source files into chat. Expand scope only when the code path proves it is required."
    ].join("\n"),
    "",
    keyValue("Suggested next command", command(context.nextCommand))
  ];
  return lines.filter((line) => line !== "").join("\n");
}

export function renderSummary(summary: Awaited<ReturnType<typeof buildWorkflowSummary>>) {
  const lines = [
    header("AgentKick summary", "Fresh-chat handoff for the current workflow state."),
    "",
    keyValue("Project", summary.project),
    summary.branch ? keyValue("Git branch", summary.branch) : "",
    keyValue("Task", summary.task),
    keyValue("Status", summary.status),
    keyValue("Scope", summary.scope),
    keyValue("Stack", summary.stack),
    summary.capabilities.length ? keyValue("Capabilities", summary.capabilities.join(", ")) : "",
    keyValue("Package manager", summary.packageManager),
    keyValue("Result", summary.result),
    keyValue("Verification state", summary.verificationState),
    keyValue("Blocker", summary.blocker),
    keyValue("Next step", summary.nextStep),
    keyValue("Appended to", summary.appendedTo),
    "",
    section("Changed files if known:"),
    ...(summary.changedFiles.length > 0
      ? summary.changedFiles.map((file) => bullet(pathLabel(file)))
      : [bullet("None known from workflow state or git diff.")]),
    "",
    section("Memory digest:"),
    ...summary.memory.map((item) => bullet(item)),
    "",
    section(summary.handoff ? "Fresh-chat handoff:" : "Fresh-chat summary:"),
    summary.handoff ? summary.handoffText : summary.freshChatSummary
  ];
  return lines.filter((line) => line !== "").join("\n");
}
