import type { Pack, Template } from "./types.js";

export const VERSION = "0.1.0";

export const SUPPORTED_TEMPLATES: Template[] = [
  "chrome-extension",
  "nextjs",
  "landing-page",
  "node-cli",
  "fastapi",
  "flask",
  "laravel",
  "go-cli",
  "rust-cli",
  "electron"
];

export const SUPPORTED_PACKS: Pack[] = [
  "core",
  "chrome-extension",
  "nextjs",
  "netlify",
  "security",
  "github",
  "python",
  "php",
  "go",
  "rust",
  "electron"
];
