import type { DetectionDebug, DoctorProblem } from "../core/types.js";

export type DoctorCheck = { ok: boolean; label: string; message: string };

export type AgentkickConfig = {
  testCommand?: string;
  buildCommand?: string;
};

export type WorkflowState = {
  activeScope?: string;
  updatedAt?: string;
  scopedFiles?: string[];
};

export type RepoFile = {
  relativePath: string;
  absolutePath: string;
  extension: string;
  bytes: number;
  lines: number;
  isReact: boolean;
};

export type WorkflowAnalysis = {
  filesScanned: number;
  sourceFiles: number;
  reactFiles: number;
  largestFiles: RepoFile[];
  generatedVendorPaths: string[];
  missingMemoryFiles: string[];
  contextWasteZones: DoctorProblem[];
};

export type DoctorAudit = {
  schemaVersion: 1;
  command: "doctor";
  score: number;
  status: "ready" | "blocked" | "needs-review";
  detectedStack: string;
  detectedCapabilities: string[];
  verificationCommand: string;
  buildCommand: string;
  nextCommand: string;
  findings: DoctorProblem[];
  generatedVendorPaths: string[];
  missingMemoryFiles: string[];
  checks: DoctorCheck[];
  warnings: string[];
  failures: string[];
  suggestions: string[];
  detectionDebug: DetectionDebug;
  analysis: WorkflowAnalysis;
};
