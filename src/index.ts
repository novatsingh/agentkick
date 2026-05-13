import { run } from "./cli.js";

run(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`agentkick failed: ${message}`);
  process.exitCode = 1;
});
