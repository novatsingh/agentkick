export type Template =
  | "chrome-extension"
  | "nextjs"
  | "landing-page"
  | "node-cli"
  | "fastapi"
  | "flask"
  | "laravel"
  | "go-cli"
  | "rust-cli"
  | "electron";

export type Pack =
  | "core"
  | "chrome-extension"
  | "nextjs"
  | "netlify"
  | "security"
  | "github"
  | "python"
  | "php"
  | "go"
  | "rust"
  | "electron";

export type PackageJson = {
  name?: string;
  version?: string;
  type?: string;
  private?: boolean;
  main?: string;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export type DetectionDebug = {
  cwd: string;
  primaryStack: string;
  capabilities: string[];
  detected: string[];
  workspaceHints: WorkspaceHint[];
  filesChecked: string[];
  dependencies: string[];
  configFiles: string[];
  reasoning: string[];
};

export type WorkspaceHint = {
  path: string;
  stack: string;
  evidence: string[];
};

export type ProjectProfile = {
  name: string;
  template: string;
  primaryStack?: string;
  capabilities?: string[];
  stack: string[];
  detection?: DetectionDebug;
  packageManager: string;
  testCommand: string;
  buildCommand: string;
  launchTarget: string;
  packs?: string[];
};

export type DoctorOptions = {
  strict?: boolean;
  json?: boolean;
  debug?: boolean;
};

export type WritePackOptions = {
  updateConfig?: boolean;
};
