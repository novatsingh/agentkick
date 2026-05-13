import chalk from "chalk";
import ora, { type Ora } from "ora";

export const logger = {
  info(message: string) {
    console.log(chalk.cyan(message));
  },
  success(message: string) {
    console.log(chalk.green(message));
  },
  warn(message: string) {
    console.log(chalk.yellow(message));
  },
  error(message: string) {
    console.error(chalk.red(message));
  },
  muted(message: string) {
    console.log(chalk.gray(message));
  }
};

export function createSpinner(message: string): Ora {
  return ora({ text: message, spinner: "dots" });
}
