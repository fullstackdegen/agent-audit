import { afterEach, describe, expect, it, vi } from "vitest";

import { createWebsiteAuditor } from "../src/audit.js";

const originalNoSandbox = process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;

afterEach(() => {
  if (originalNoSandbox === undefined) {
    delete process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;
  } else {
    process.env.LIGHTHOUSE_CHROME_NO_SANDBOX = originalNoSandbox;
  }
});

describe("createWebsiteAuditor", () => {
  it("keeps the Chrome sandbox enabled by default", async () => {
    delete process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;
    const kill = vi.fn();
    const launchChrome = vi.fn(async () => ({ port: 9222, kill }));
    const runLighthouse = vi.fn(async () => ({
      lhr: {
        categories: {},
        audits: {},
      },
    }));
    const auditWebsite = createWebsiteAuditor({ launchChrome, runLighthouse });

    await auditWebsite(new URL("https://example.com"));

    expect(launchChrome).toHaveBeenCalledWith(
      expect.objectContaining({
        chromeFlags: expect.not.arrayContaining(["--no-sandbox"]),
      }),
    );
    expect(kill).toHaveBeenCalledOnce();
  });

  it("terminates Chrome when Lighthouse throws", async () => {
    const kill = vi.fn();
    const auditWebsite = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill }),
      runLighthouse: async () => {
        throw new Error("audit failed");
      },
    });

    await expect(
      auditWebsite(new URL("https://example.com")),
    ).rejects.toThrow("audit failed");
    expect(kill).toHaveBeenCalledOnce();
  });
});
