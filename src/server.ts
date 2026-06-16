import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import {
  auditWebsite as runLighthouseAudit,
  type AuditWebsite,
} from "./audit.js";
import { renderReportMarkdown } from "./markdown.js";
import {
  lighthouseReportOutputSchema,
  lighthouseToolInputSchema,
  parseAuditMode,
} from "./report-schema.js";
import { assertPublicHttpUrl } from "./url-policy.js";

export interface LighthouseServerDependencies {
  auditWebsite?: AuditWebsite;
  validateUrl?: (input: unknown) => Promise<URL>;
}

const TOOL_NAME = "analyze_website_performance";
const SERVER_VERSION = "0.1.2";

/**
 * Creates the Lighthouse MCP server and its schema-validated tool contract.
 */
export function createLighthouseServer(
  dependencies: LighthouseServerDependencies = {},
): Server {
  const auditWebsite = dependencies.auditWebsite ?? runLighthouseAudit;
  const validateUrl = dependencies.validateUrl ?? assertPublicHttpUrl;
  const server = new Server(
    {
      name: "mcp-server-lighthouse",
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Runs reliable mobile and desktop Lighthouse audits and returns an implementation-ready structured report with equivalent Markdown.",
        inputSchema: lighthouseToolInputSchema,
        outputSchema: lighthouseReportOutputSchema,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== TOOL_NAME) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`,
      );
    }

    const mode = parseModeOrThrow(request.params.arguments?.mode);
    const url = await validateUrlOrThrow(
      request.params.arguments?.url,
      validateUrl,
    );

    try {
      const report = await auditWebsite(url, mode);
      return {
        content: [{ type: "text", text: renderReportMarkdown(report) }],
        structuredContent: report as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: toSafeErrorMessage(error) }],
      };
    }
  });

  return server;
}

function parseModeOrThrow(input: unknown) {
  try {
    return parseAuditMode(input);
  } catch (error) {
    throw new McpError(ErrorCode.InvalidParams, errorMessage(error));
  }
}

async function validateUrlOrThrow(
  input: unknown,
  validateUrl: (input: unknown) => Promise<URL>,
): Promise<URL> {
  try {
    return await validateUrl(input);
  } catch (error) {
    throw new McpError(ErrorCode.InvalidParams, errorMessage(error));
  }
}

function toSafeErrorMessage(error: unknown): string {
  return `Lighthouse audit failed: ${errorMessage(error)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error.";
}
