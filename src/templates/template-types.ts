import type { ProjectProfile, Template } from "../core/types.js";

export type TemplateFile = {
  path: string;
  content: string;
};

export type TemplateDefinition = {
  id: Template;
  label: string;
  description: string;
  defaultPacks: string[];
  files: (profile: ProjectProfile) => TemplateFile[];
};

export type TemplateVariables = Record<string, string>;
