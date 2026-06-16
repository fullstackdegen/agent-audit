#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { parseCliOptions } from "./cli-options.js";
import { createLighthouseServer } from "./server.js";

/**
 * Connects the Lighthouse MCP server to the standard I/O transport.
 */
async function main(): Promise<void> {
  const cliOptions = parseCliOptions(process.argv.slice(2));

  if (cliOptions.action === "help") {
    process.stdout.write(`${cliOptions.text}\n`);
    return;
  }

  if (cliOptions.action === "error") {
    process.stderr.write(`${cliOptions.text}\n`);
    process.exitCode = 1;
    return;
  }

  const server = createLighthouseServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Lighthouse MCP server is ready on stdio.");
}

main().catch((error: unknown) => {
  console.error("Failed to initialize the Lighthouse MCP server:", error);
  process.exitCode = 1;
});
