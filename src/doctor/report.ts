import type { DetectionDebug, DoctorOptions, DoctorProblem } from "../core/types.js";
import { bullet, checkStatus, command, header, keyValue, pathLabel, score, section, status } from "../utils/ui.js";
import type { DoctorAudit, WorkflowAnalysis } from "./types.js";

export function printAudit(audit: DoctorAudit, options: DoctorOptions) {
  console.log(header("AgentKick doctor", "AI workflow readiness for this repository."));
  console.log("");
  console.log(`AI Readiness Score: ${score(audit.score)}`);
  console.log(`Status: ${status(audit.status)}`);
  if (options.strict) console.log("Mode: strict");
  console.log(keyValue("Verification", audit.verificationCommand));
  console.log(keyValue("Build", audit.buildCommand));
  console.log("");

  console.log(section("Detected stack:"));
  if (audit.detectedStack === "generic") {
    console.log(bullet("generic"));
    console.log(command("Could not confidently detect stack. Run agentkick doctor --debug to see checked files."));
    printWorkspaceHints(audit.detectionDebug);
  } else {
    for (const item of [audit.detectedStack, ...audit.detectedCapabilities]) console.log(bullet(item));
  }
  console.log("");

  printFindingBlock("Top 3 risks:", audit.findings.slice(0, 3));
  printFindingBlock("Top context waste zones:", audit.analysis.contextWasteZones.slice(0, 5));
  printMissingMemory(audit);

  console.log(section("Generated/vendor paths detected:"));
  if (audit.generatedVendorPaths.length === 0) console.log(bullet("none"));
  for (const item of audit.generatedVendorPaths) console.log(bullet(pathLabel(item)));
  console.log("");

  console.log(section("Workflow checks:"));
  for (const check of audit.checks) {
    console.log(`${checkStatus(check.ok)} ${check.label}: ${check.message}`);
  }

  if (audit.suggestions.length > 0) {
    console.log("");
    console.log(section("Suggested fixes:"));
    for (const suggestion of audit.suggestions.slice(0, 6)) console.log(bullet(suggestion));
  }

  console.log("");
  console.log(keyValue("Next", command(audit.nextCommand)));

  if (options.debug) {
    printDetectionDebug(audit.detectionDebug);
    printWorkflowDebug(audit.analysis);
  }
}

function printFindingBlock(title: string, findings: DoctorProblem[]) {
  console.log(section(title));
  if (findings.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const finding of findings) {
    const file = finding.file && !finding.title.includes(finding.file) ? ` ${pathLabel(finding.file)}` : "";
    console.log(bullet(`${finding.priority} ${finding.category}: ${finding.title}${file}`));
    console.log(`  ${keyValue("Signal", finding.signal)}`);
    console.log(`  ${keyValue("Agent impact", finding.agentImpact)}`);
    console.log(`  ${keyValue("Fix", finding.recommendation)}`);
  }
  console.log("");
}

function printMissingMemory(audit: DoctorAudit) {
  console.log(section("Missing memory/workflow files:"));
  if (audit.missingMemoryFiles.length === 0) {
    console.log(bullet("none"));
    console.log("");
    return;
  }
  for (const item of audit.missingMemoryFiles) console.log(bullet(item));
  console.log("");
}

export function jsonAudit(audit: DoctorAudit) {
  return {
    schemaVersion: audit.schemaVersion,
    command: audit.command,
    score: audit.score,
    status: audit.status,
    detectedStack: {
      primary: audit.detectedStack,
      capabilities: audit.detectedCapabilities
    },
    verificationCommand: audit.verificationCommand,
    buildCommand: audit.buildCommand,
    nextCommand: audit.nextCommand,
    findings: audit.findings,
    generatedVendorPaths: audit.generatedVendorPaths,
    missingMemoryFiles: audit.missingMemoryFiles,
    checks: audit.checks,
    warnings: audit.warnings,
    failures: audit.failures
  };
}

export function printDetectionDebug(detection: DetectionDebug) {
  console.log("");
  console.log(section("Stack detection debug:"));
  console.log(`Current working directory: ${detection.cwd}`);
  console.log("Files checked:");
  printList(detection.filesChecked);
  console.log("package.json dependencies found:");
  printList(detection.dependencies);
  console.log("Config files found:");
  printList(detection.configFiles);
  console.log("Final detection reasoning:");
  printList(detection.reasoning);
}

export function printWorkflowDebug(analysis: WorkflowAnalysis) {
  console.log("");
  console.log(section("Workflow analysis debug:"));
  console.log(`Files scanned: ${analysis.filesScanned}`);
  console.log(`Source files scanned: ${analysis.sourceFiles}`);
  console.log(`React files scanned: ${analysis.reactFiles}`);
  console.log("Largest source files:");
  if (analysis.largestFiles.length === 0) {
    console.log("- none");
    return;
  }
  for (const file of analysis.largestFiles) {
    console.log(bullet(`${pathLabel(file.relativePath)} (${file.lines} lines, ${file.bytes} bytes)`));
  }
}

function printWorkspaceHints(detection: DetectionDebug) {
  if (detection.workspaceHints.length === 0) return;

  console.log("");
  console.log(section("This looks like a workspace folder, not a single app repo."));
  console.log("Run AgentKick inside one project folder, for example:");
  for (const hint of detection.workspaceHints.slice(0, 5)) {
    console.log(`  ${command(`cd ${hint.path}`)}  # ${hint.stack}`);
  }
}

function printList(items: string[]) {
  if (!items || items.length === 0) {
    console.log("- none");
    return;
  }
  for (const item of items) console.log(bullet(item));
}
