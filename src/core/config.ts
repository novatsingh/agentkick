import path from "node:path";
import { z } from "zod";
import { readJsonSafe } from "../utils/fs.js";

const AgentKickConfigSchema = z
  .object({
    schemaVersion: z.number().optional(),
    name: z.string().optional(),
    stack: z.array(z.string()).optional(),
    packageManager: z.string().optional(),
    testCommand: z.string().optional(),
    buildCommand: z.string().optional(),
    launchTarget: z.string().optional(),
    packs: z.array(z.string()).optional(),
    safety: z
      .object({
        preserveBackups: z.boolean().optional(),
        mcpFilesystemScope: z.string().optional(),
        destructiveActionsRequireApproval: z.boolean().optional()
      })
      .optional()
  })
  .passthrough();

export type AgentKickConfig = z.infer<typeof AgentKickConfigSchema>;

export function loadConfig(cwd: string): AgentKickConfig | null {
  const raw = readJsonSafe(path.join(cwd, ".agentkick.json"));
  if (!raw) return null;
  const parsed = AgentKickConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
