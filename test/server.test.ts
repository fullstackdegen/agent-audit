import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLighthouseServer } from "../src/server.js";

const clients: Client[] = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
});

describe("Lighthouse MCP server", () => {
  it("publishes the website analysis tool", async () => {
    const client = await connectTestClient();
    const result = await client.listTools();

    expect(result.tools).toEqual([
      expect.objectContaining({
        name: "analyze_website_performance",
        inputSchema: expect.objectContaining({ required: ["url"] }),
      }),
    ]);
  });

  it("rejects unknown tool names", async () => {
    const client = await connectTestClient();

    await expect(
      client.callTool({ name: "unknown_tool", arguments: {} }),
    ).rejects.toMatchObject({ code: -32601 });
  });

  it("returns a tool error for an invalid URL", async () => {
    const auditWebsite = vi.fn(async () => "unused");
    const client = await connectTestClient({ auditWebsite });

    const result = await client.callTool({
      name: "analyze_website_performance",
      arguments: { url: "file:///etc/passwd" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      expect.objectContaining({
        type: "text",
        text: expect.stringMatching(/HTTP and HTTPS/i),
      }),
    ]);
    expect(auditWebsite).not.toHaveBeenCalled();
  });

  it("returns the generated report for a valid URL", async () => {
    const auditWebsite = vi.fn(async () => "audit report");
    const client = await connectTestClient({
      auditWebsite,
      validateUrl: async (input) => new URL(String(input)),
    });

    const result = await client.callTool({
      name: "analyze_website_performance",
      arguments: { url: "https://example.com" },
    });

    expect(auditWebsite).toHaveBeenCalledWith(new URL("https://example.com"));
    expect(result).toMatchObject({
      content: [{ type: "text", text: "audit report" }],
    });
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
