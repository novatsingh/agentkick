import chalk from "chalk";

export function header(title: string, subtitle?: string) {
  const lines = [chalk.bold.cyan(title)];
  if (subtitle) lines.push(chalk.gray(subtitle));
  return lines.join("\n");
}

export function section(title: string) {
  return chalk.bold(title);
}

export function bullet(value: string) {
  return `${chalk.gray("-")} ${value}`;
}

export function keyValue(key: string, value: string) {
  return `${chalk.gray(`${key}:`)} ${value}`;
}

export function command(value: string) {
  return chalk.cyan(value);
}

export function pathLabel(value: string) {
  return chalk.cyan(value);
}

export function muted(value: string) {
  return chalk.gray(value);
}

export function status(value: "ready" | "blocked" | "needs-review" | string) {
  if (value === "ready") return chalk.green(value);
  if (value === "blocked") return chalk.red(value);
  if (value === "needs-review") return chalk.yellow(value);
  return value;
}

export function score(value: number) {
  if (value >= 85) return chalk.green(`${value}/100`);
  if (value >= 65) return chalk.yellow(`${value}/100`);
  return chalk.red(`${value}/100`);
}

export function severity(value: string) {
  if (value === "high") return chalk.red(value);
  if (value === "medium") return chalk.yellow(value);
  return chalk.gray(value);
}

export function checkStatus(ok: boolean) {
  return ok ? chalk.green("PASS") : chalk.red("FAIL");
}

export function nextSteps(steps: string[]) {
  return [section("Next steps:"), ...steps.map((step) => `  ${command(step)}`)].join("\n");
}

export function errorMessage(message: string) {
  return `${chalk.red("error")} ${message}`;
}

export function hint(message: string) {
  return `${chalk.gray("hint")} ${message}`;
}
