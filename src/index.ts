#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createLighthouseServer } from "./server.js";

/**
 * Connects the Lighthouse MCP server to the standard I/O transport.
 */
async function main(): Promise<void> {
  const server = createLighthouseServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Lighthouse MCP server is ready on stdio.");
}

main().catch((error: unknown) => {
  console.error("Failed to initialize the Lighthouse MCP server:", error);
  process.exitCode = 1;
});
