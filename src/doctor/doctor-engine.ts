import fs from "node:fs";
import path from "node:path";
import type { DoctorOptions, DoctorPriority, DoctorProblem, PackageJson } from "../core/types.js";
import { detectProject } from "../detectors/project-detector.js";
import { readJsonSafe } from "../utils/fs.js";
import {
  GENERATED_VENDOR_CANDIDATES,
  OPTIONAL_AGENT_FILES,
  REQUIRED_AGENT_FILES,
  SOURCE_EXTENSIONS,
  WORKFLOW_MEMORY_FILES
} from "./constants.js";
import { optionalFile, requiredFile } from "./checks.js";
import {
  analysisFindings,
  findingMessage,
  nextCommandFor,
  suggestionsFor,
  memoryFindings,
  verificationFindings,
  generatedVendorFindings,
  sourceFileFindings,
  reactFindings,
  modularityFindings,
  taskStateFindings,
  ciFindings
} from "./findings.js";
import { jsonAudit, printAudit } from "./report.js";
import { scanRepoFiles } from "./scanner.js";
import type { AgentkickConfig, DoctorAudit, WorkflowAnalysis, WorkflowState } from "./types.js";
import { commandFor, directoryExists, fallbackDetection } from "./utils.js";

export function runDoctor(cwd: string, options: DoctorOptions = {}) {
  const audit = auditRepo(cwd);
  if (options.json) {
    console.log(JSON.stringify(jsonAudit(audit), null, 2));
  } else {
    printAudit(audit, options);
  }
  if (options.strict && (audit.findings.some((finding) => finding.priority === "P0") || audit.score < 85)) {
    process.exitCode = 1;
  }
}

function auditRepo(cwd: string): DoctorAudit {
  const packageInfo = readJsonSafe<PackageJson>(path.join(cwd, "package.json"));
  const config = readJsonSafe<AgentkickConfig>(path.join(cwd, ".agentkick.json"));
  const workflowState = readJsonSafe<WorkflowState>(path.join(cwd, ".agentkick", "workflow-state.json"));
  const profile = detectProject(cwd);
  const checks = [
    ...REQUIRED_AGENT_FILES.map(([file, label]) => requiredFile(cwd, file, label)),
    ...OPTIONAL_AGENT_FILES.map(([file, label]) => optionalFile(cwd, file, label))
  ];
  const verificationCommand = commandFor(profile.testCommand, "test", packageInfo?.scripts?.test);
  const buildCommand = commandFor(profile.buildCommand, "build", packageInfo?.scripts?.build);
  const analysis = analyzeWorkflow(cwd, packageInfo, config, workflowState);
  const findings = analysisFindings(cwd, packageInfo, config, workflowState, analysis);
  const failures = checks.filter((check) => !check.ok).map((check) => check.message);
  const scoreValue = readinessScore(findings);
  const statusValue = statusFor(scoreValue, findings);

  return {
    schemaVersion: 1,
    command: "doctor",
    score: scoreValue,
    status: statusValue,
    detectedStack: profile.primaryStack ?? profile.template,
    detectedCapabilities: profile.capabilities ?? [],
    verificationCommand,
    buildCommand,
    nextCommand: nextCommandFor(findings),
    findings,
    generatedVendorPaths: analysis.generatedVendorPaths,
    missingMemoryFiles: analysis.missingMemoryFiles,
    checks,
    warnings: findings.filter((finding) => finding.priority !== "P0").map(findingMessage),
    failures: [...failures, ...findings.filter((finding) => finding.priority === "P0").map(findingMessage)],
    suggestions: suggestionsFor(findings),
    detectionDebug:
      profile.detection ?? fallbackDetection(cwd, profile.primaryStack ?? profile.template, profile.stack),
    analysis
  };
}

function analyzeWorkflow(
  cwd: string,
  packageInfo: PackageJson | null,
  config: AgentkickConfig | null,
  workflowState: WorkflowState | null
): WorkflowAnalysis {
  const files = scanRepoFiles(cwd);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(file.extension));
  const reactFiles = sourceFiles.filter((file) => file.isReact);
  const generatedVendorPaths = GENERATED_VENDOR_CANDIDATES.filter((candidate) => directoryExists(cwd, candidate));
  const missingMemoryFiles = WORKFLOW_MEMORY_FILES.filter(
    (file) => !directoryExists(cwd, file) && !pathExists(cwd, file)
  );
  const preliminary = [
    ...memoryFindings(cwd, missingMemoryFiles, workflowState),
    ...verificationFindings(packageInfo, config),
    ...generatedVendorFindings(cwd, generatedVendorPaths),
    ...sourceFileFindings(sourceFiles),
    ...reactFindings(reactFiles),
    ...modularityFindings(cwd, sourceFiles),
    ...taskStateFindings(cwd, workflowState),
    ...ciFindings(cwd)
  ];

  return {
    filesScanned: files.length,
    sourceFiles: sourceFiles.length,
    reactFiles: reactFiles.length,
    largestFiles: [...sourceFiles].sort((a, b) => b.lines - a.lines || b.bytes - a.bytes).slice(0, 8),
    generatedVendorPaths,
    missingMemoryFiles,
    contextWasteZones: preliminary.filter((finding) =>
      ["context-waste", "token-waste", "file-size", "react-component"].includes(finding.category)
    )
  };
}

function readinessScore(findings: DoctorProblem[]) {
  const weights: Record<DoctorPriority, number> = { P0: 22, P1: 12, P2: 6, P3: 2 };
  const penalty = findings.reduce((total, finding) => total + weights[finding.priority], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function statusFor(scoreValue: number, findings: DoctorProblem[]) {
  if (findings.some((finding) => finding.priority === "P0")) return "blocked";
  if (scoreValue >= 85) return "ready";
  return "needs-review";
}

function pathExists(cwd: string, relativePath: string) {
  try {
    return fs.existsSync(path.join(cwd, relativePath));
  } catch {
    return false;
  }
}
