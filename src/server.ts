import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { auditWebsite as runLighthouseAudit } from "./audit.js";
import { assertPublicHttpUrl } from "./url-policy.js";

export interface LighthouseServerDependencies {
  auditWebsite?: (url: URL) => Promise<string>;
  validateUrl?: (input: unknown) => Promise<URL>;
}

const TOOL_NAME = "analyze_website_performance";

/**
 * Creates an MCP server with an injectable audit boundary for deterministic tests.
 */
export function createLighthouseServer(
  dependencies: LighthouseServerDependencies = {},
): Server {
  const auditWebsite = dependencies.auditWebsite ?? runLighthouseAudit;
  const validateUrl = dependencies.validateUrl ?? assertPublicHttpUrl;
  const server = new Server(
    {
      name: "mcp-server-lighthouse",
      version: "0.1.0",
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
          "Runs Google Lighthouse against a public URL and reports Performance, Accessibility, Best Practices, and SEO diagnostics.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            url: {
              type: "string",
              description:
                "A fully qualified public HTTP or HTTPS URL, for example https://example.com.",
            },
          },
          required: ["url"],
        },
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

    try {
      const url = await validateUrl(request.params.arguments?.url);
      const report = await auditWebsite(url);

      return {
        content: [{ type: "text", text: report }],
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

function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `Lighthouse audit failed: ${error.message}`;
  }

  return "Lighthouse audit failed due to an unknown error.";
}
