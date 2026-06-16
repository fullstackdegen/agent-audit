export type MutableEnvironment = Record<string, string | undefined>;

export type CliOptionsResult =
  | { action: "start" }
  | { action: "help"; text: string }
  | { action: "error"; text: string };

const HELP_TEXT = `Usage: mcp-server-lighthouse [options]

Options:
  --local        Allow localhost and loopback audits for local development.
  --help, -h     Show this help message.

By default, only publicly routable HTTP and HTTPS targets are accepted.`;

/**
 * Parses startup-only CLI flags before the MCP stdio transport is connected.
 */
export function parseCliOptions(
  args: string[],
  env: MutableEnvironment = process.env,
): CliOptionsResult {
  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      return { action: "help", text: formatCliHelp() };
    }

    if (arg === "--local") {
      env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST = "true";
      continue;
    }

    return {
      action: "error",
      text: `Unknown option: ${arg}\n\n${formatCliHelp()}`,
    };
  }

  return { action: "start" };
}

export function formatCliHelp(): string {
  return HELP_TEXT;
}
