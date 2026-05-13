import { execa } from "execa";

export async function gitBranch(cwd: string) {
  try {
    const result = await execa("git", ["branch", "--show-current"], { cwd });
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}
