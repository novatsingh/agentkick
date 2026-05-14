import type { ProjectProfile, Template } from "../core/types.js";
import { writeFile } from "../utils/fs.js";
import { readmeFor } from "./agent-files.js";
import { chromeExtensionFiles } from "./chrome-extension-template.js";
import { electronAppFiles, tauriAppFiles } from "./desktop-templates.js";
import { internalToolFiles } from "./internal-tool-template.js";
import { aiSaasFiles, marketplaceFiles, saasFiles } from "./next-templates.js";
import { gitignoreFor, render, sharedMemoryFiles, variablesFor } from "./shared-template-files.js";
import type { TemplateDefinition, TemplateFile } from "./template-types.js";

export const TEMPLATE_REGISTRY: Record<Template, TemplateDefinition> = {
  "ai-saas": {
    id: "ai-saas",
    label: "AI SaaS",
    description: "Next.js product shell with AI workflow boundaries.",
    defaultPacks: ["core", "github"],
    files: aiSaasFiles
  },
  "chrome-extension": {
    id: "chrome-extension",
    label: "Chrome Extension",
    description: "Manifest V3 extension with popup, content, and background boundaries.",
    defaultPacks: ["core", "chrome-extension", "github"],
    files: chromeExtensionFiles
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Buyer/seller marketplace starter with scoped domains.",
    defaultPacks: ["core", "github"],
    files: marketplaceFiles
  },
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Clean SaaS app shell with product, billing, and dashboard zones.",
    defaultPacks: ["core", "github"],
    files: saasFiles
  },
  "internal-tool": {
    id: "internal-tool",
    label: "Internal Tool",
    description: "Operational dashboard template with workflow-first boundaries.",
    defaultPacks: ["core", "github"],
    files: internalToolFiles
  },
  "electron-app": {
    id: "electron-app",
    label: "Electron App",
    description: "Electron + React + Vite desktop app with secure process boundaries.",
    defaultPacks: ["core", "electron", "github"],
    files: electronAppFiles
  },
  "tauri-app": {
    id: "tauri-app",
    label: "Tauri App",
    description: "Tauri + React + Vite native desktop app with explicit command bridge.",
    defaultPacks: ["core", "tauri", "github"],
    files: tauriAppFiles
  }
};

export function getTemplateDefinition(template: Template): TemplateDefinition {
  return TEMPLATE_REGISTRY[template];
}

export function templateChoices(): Array<{ name: string; value: Template; description: string }> {
  return Object.values(TEMPLATE_REGISTRY).map((template) => ({
    name: template.label,
    value: template.id,
    description: template.description
  }));
}

export async function writeTemplateProject(projectDir: string, profile: ProjectProfile) {
  const definition = getTemplateDefinition(profile.template as Template);
  const variables = variablesFor(profile, definition);
  const templateFiles: TemplateFile[] = [
    ...definition.files(profile),
    ...sharedMemoryFiles(profile, definition),
    { path: "README.md", content: readmeFor(profile) },
    { path: ".gitignore", content: gitignoreFor(profile) },
    {
      path: ".agentkick.json",
      content: JSON.stringify(
        {
          project: profile.name,
          template: profile.template,
          stack: profile.stack,
          packageManager: profile.packageManager,
          createdAt: new Date().toISOString(),
          workflowPacks: definition.defaultPacks
        },
        null,
        2
      )
    }
  ];

  for (const file of templateFiles) {
    await writeFile(projectDir, file.path, render(file.content, variables));
  }

  return {
    files: templateFiles.map((file) => file.path).sort(),
    packs: definition.defaultPacks
  };
}

export function postInstallStepsFor(template: Template): string[] {
  if (template === "tauri-app") {
    return [
      "Install Rust and Tauri system prerequisites before running npm run dev.",
      "Run npm install inside the generated project.",
      "Run npm run typecheck before starting Tauri.",
      "Run npm run dev when your Rust/Tauri toolchain is ready."
    ];
  }

  return ["Run npm install inside the generated project.", "Run npm run dev to start the app."];
}
