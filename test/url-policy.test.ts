import { describe, expect, it } from "vitest";

import {
  assertAuditTargetUrl,
  assertPublicHttpUrl,
  isLocalhostAllowedFromEnv,
  parseAuditTargetUrl,
  parsePublicHttpUrl,
} from "../src/url-policy.js";

describe("parsePublicHttpUrl", () => {
  it("accepts a fully qualified public HTTPS URL", () => {
    expect(parsePublicHttpUrl("https://example.com/path").href).toBe(
      "https://example.com/path",
    );
  });

  it.each([
    "file:///etc/passwd",
    "ftp://example.com",
    "https://user:password@example.com",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://192.168.1.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]",
    "not-a-url",
  ])("rejects unsafe target %s", (value) => {
    expect(() => parsePublicHttpUrl(value)).toThrow();
  });
});

describe("assertPublicHttpUrl", () => {
  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      assertPublicHttpUrl("https://internal.example", async () => [
        { address: "10.0.0.4", family: 4 },
      ]),
    ).rejects.toThrow(/publicly routable/i);
  });

  it("returns a normalized URL when every resolved address is public", async () => {
    const url = await assertPublicHttpUrl("https://example.com", async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);

    expect(url.href).toBe("https://example.com/");
  });
});

describe("parseAuditTargetUrl", () => {
  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://app.localhost:3000",
  ])("allows localhost target in explicit local mode: %s", (value) => {
    expect(parseAuditTargetUrl(value, { allowLocalhost: true }).href).toBe(
      new URL(value).href,
    );
  });

  it.each(["http://192.168.1.10", "http://10.0.0.1"])(
    "still rejects private network target in local mode: %s",
    (value) => {
      expect(() =>
        parseAuditTargetUrl(value, { allowLocalhost: true }),
      ).toThrow(/publicly routable/i);
    },
  );

  it("still rejects hostnames that resolve to private addresses in local mode", async () => {
    await expect(
      assertAuditTargetUrl(
        "https://internal.example",
        async () => [{ address: "10.0.0.4", family: 4 }],
        { allowLocalhost: true },
      ),
    ).rejects.toThrow(/publicly routable/i);
  });

  it.each([
    [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "true" }, true],
    [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "TRUE" }, false],
    [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "1" }, false],
    [{}, false],
  ])("reads localhost mode from env %#", (env, expected) => {
    expect(isLocalhostAllowedFromEnv(env)).toBe(expected);
  });
});
