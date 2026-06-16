import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderReportMarkdown } from "../src/markdown.js";
import { buildAgentReadyReport } from "../src/report-builder.js";
import { createLighthouseServer } from "../src/server.js";
import { makeLighthouseResult } from "./fixtures/lighthouse-results.js";

const clients: Client[] = [];
const originalAllowLocalhost = process.env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST;

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  if (originalAllowLocalhost === undefined) {
    delete process.env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST;
  } else {
    process.env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST = originalAllowLocalhost;
  }
});

describe("Lighthouse MCP server", () => {
  it("publishes input and structured output schemas", async () => {
    const client = await connectTestClient();
    const result = await client.listTools();

    expect(result.tools[0]).toMatchObject({
      name: "analyze_website_performance",
      inputSchema: {
        required: ["url"],
        properties: {
          mode: {
            type: "string",
            enum: ["fast", "reliable"],
            default: "reliable",
          },
        },
      },
      outputSchema: {
        type: "object",
        required: expect.arrayContaining(["profiles", "prioritizedIssues"]),
      },
    });
  });

  it("publishes the package version in server metadata", async () => {
    const client = await connectTestClient();

    expect(client.getServerVersion()).toEqual({
      name: "mcp-server-lighthouse",
      version: "0.1.2",
    });
  });

  it("rejects unknown tool names", async () => {
    const client = await connectTestClient();

    await expect(
      client.callTool({ name: "unknown_tool", arguments: {} }),
    ).rejects.toMatchObject({ code: -32601 });
  });

  it.each([
    [{ url: "file:///etc/passwd" }, /HTTP and HTTPS/i],
    [{ url: "https://example.com", mode: "custom" }, /mode/i],
  ])("rejects invalid arguments with InvalidParams", async (arguments_, message) => {
    const auditWebsite = vi.fn(async () => makeReport());
    const client = await connectTestClient({ auditWebsite });

    await expect(
      client.callTool({
        name: "analyze_website_performance",
        arguments: arguments_,
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(message) });
    expect(auditWebsite).not.toHaveBeenCalled();
  });

  it("returns canonical structured content and equivalent Markdown", async () => {
    const report = makeReport();
    const auditWebsite = vi.fn(async () => report);
    const client = await connectTestClient({
      auditWebsite,
      validateUrl: async (input) => new URL(String(input)),
    });

    const result = await client.callTool({
      name: "analyze_website_performance",
      arguments: { url: "https://example.com" },
    });

    expect(auditWebsite).toHaveBeenCalledWith(
      new URL("https://example.com"),
      "reliable",
    );
    expect(result.structuredContent).toEqual(report);
    expect(result.content).toEqual([
      { type: "text", text: renderReportMarkdown(report) },
    ]);
  });

  it("passes fast mode to the auditor", async () => {
    const report = makeReport("fast");
    const auditWebsite = vi.fn(async () => report);
    const client = await connectTestClient({
      auditWebsite,
      validateUrl: async (input) => new URL(String(input)),
    });

    await client.callTool({
      name: "analyze_website_performance",
      arguments: { url: "https://example.com", mode: "fast" },
    });

    expect(auditWebsite).toHaveBeenCalledWith(
      new URL("https://example.com"),
      "fast",
    );
  });

  it("allows localhost through the default validator when dev mode is enabled", async () => {
    process.env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST = "true";
    const report = makeReport("fast");
    const auditWebsite = vi.fn(async () => report);
    const client = await connectTestClient({ auditWebsite });

    await client.callTool({
      name: "analyze_website_performance",
      arguments: { url: "http://localhost:3000", mode: "fast" },
    });

    expect(auditWebsite).toHaveBeenCalledWith(
      new URL("http://localhost:3000"),
      "fast",
    );
  });
});

async function connectTestClient(
  dependencies: Parameters<typeof createLighthouseServer>[0] = {},
): Promise<Client> {
  const server = createLighthouseServer(dependencies);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  clients.push(client);

  return client;
}

function makeReport(mode: "fast" | "reliable" = "reliable") {
  const count = mode === "reliable" ? 3 : 1;
  return buildAgentReadyReport({
    requestedUrl: "https://example.com",
    mode,
    generatedAt: new Date("2026-06-13T12:00:00.000Z"),
    profiles: {
      mobile: {
        attemptedRuns: count,
        failures: [],
        runs: Array.from({ length: count }, () => makeLighthouseResult()),
      },
      desktop: {
        attemptedRuns: count,
        failures: [],
        runs: Array.from({ length: count }, () =>
          makeLighthouseResult({ formFactor: "desktop" }),
        ),
      },
    },
  });
}
