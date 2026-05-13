import type { Command } from "commander";
import { setWriteMode } from "../utils/fs.js";

export type GlobalOptions = {
  dryRun?: boolean;
};

export function applyWriteMode(program: Command, options: GlobalOptions = {}) {
  const globalOptions = program.opts<GlobalOptions>();
  setWriteMode({ dryRun: Boolean(options.dryRun ?? globalOptions.dryRun) });
}

export function isDryRun(program: Command, options: GlobalOptions = {}) {
  const globalOptions = program.opts<GlobalOptions>();
  return Boolean(options.dryRun ?? globalOptions.dryRun);
}
