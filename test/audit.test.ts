import { afterEach, describe, expect, it, vi } from "vitest";

import { createWebsiteAuditor } from "../src/audit.js";
import { makeLighthouseResult } from "./fixtures/lighthouse-results.js";

const originalNoSandbox = process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;

afterEach(() => {
  if (originalNoSandbox === undefined) {
    delete process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;
  } else {
    process.env.LIGHTHOUSE_CHROME_NO_SANDBOX = originalNoSandbox;
  }
});

describe("createWebsiteAuditor", () => {
  it("runs mobile then desktop once in fast mode and cleans up each profile", async () => {
    delete process.env.LIGHTHOUSE_CHROME_NO_SANDBOX;
    const events: string[] = [];
    const kills = [vi.fn(), vi.fn()];
    let launchIndex = 0;
    const launchChrome = vi.fn(async (options) => {
      events.push(`launch-${launchIndex}`);
      expect(options.chromeFlags).not.toContain("--no-sandbox");
      return { port: 9222 + launchIndex, kill: kills[launchIndex++]! };
    });
    const runLighthouse = vi.fn(async (_url, flags, config) => {
      const profile = config?.settings?.formFactor === "desktop"
        ? "desktop"
        : "mobile";
      events.push(`run-${profile}`);
      return {
        lhr: makeLighthouseResult({
          formFactor: profile,
        }),
      };
    });
    const auditWebsite = createWebsiteAuditor({
      launchChrome,
      runLighthouse,
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence: async () => makeSiteIntelligence(),
    });

    const report = await auditWebsite(
      new URL("https://example.com"),
      "fast",
    );

    expect(runLighthouse).toHaveBeenCalledTimes(2);
    expect(events).toEqual([
      "launch-0",
      "run-mobile",
      "launch-1",
      "run-desktop",
    ]);
    expect(kills[0]).toHaveBeenCalledOnce();
    expect(kills[1]).toHaveBeenCalledOnce();
    expect(report.status).toBe("complete");
  });

  it("runs each profile three times in reliable mode", async () => {
    const runLighthouse = vi.fn(async (_url, _flags, config) => ({
      lhr: makeLighthouseResult({
        formFactor:
          config?.settings?.formFactor === "desktop" ? "desktop" : "mobile",
      }),
    }));
    const auditWebsite = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill: vi.fn() }),
      runLighthouse,
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence: async () => makeSiteIntelligence(),
    });

    const report = await auditWebsite(
      new URL("https://example.com"),
      "reliable",
    );

    expect(runLighthouse).toHaveBeenCalledTimes(6);
    expect(report.profiles.mobile.successfulRuns).toBe(3);
    expect(report.profiles.desktop.successfulRuns).toBe(3);
  });

  it("runs site intelligence once for the requested URL", async () => {
    const siteIntelligence = makeSiteIntelligence();
    const analyzeSiteIntelligence = vi.fn(async () => siteIntelligence);
    const auditor = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill: vi.fn() }),
      runLighthouse: async () => ({ lhr: makeLighthouseResult() }),
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence,
    });

    const report = await auditor(new URL("https://example.com/"), "fast");

    expect(analyzeSiteIntelligence).toHaveBeenCalledOnce();
    expect(analyzeSiteIntelligence).toHaveBeenCalledWith(
      new URL("https://example.com/"),
    );
    expect(report.siteIntelligence).toBe(siteIntelligence);
  });

  it("reports failed site intelligence without rejecting the audit", async () => {
    const auditor = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill: vi.fn() }),
      runLighthouse: async () => ({ lhr: makeLighthouseResult() }),
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence: async () => {
        throw new Error("site intelligence unavailable");
      },
    });

    const report = await auditor(new URL("https://example.com/"), "fast");

    expect(report.status).toBe("complete");
    expect(report.siteIntelligence).toMatchObject({
      status: "failed",
      inspectedUrl: "https://example.com/",
      fetchedResources: {
        html: {
          url: "https://example.com/",
          statusCode: null,
          ok: false,
          contentType: null,
          finalUrl: "https://example.com/",
          error: "site intelligence unavailable",
        },
        robotsTxt: null,
        sitemapXml: null,
      },
      checks: [],
      llmsTxt: {
        status: "insufficient-content",
        text: null,
        evidence: ["site intelligence unavailable"],
      },
      prioritizedIssues: [],
    });
  });

  it("records an individual failure without aborting a reliable profile", async () => {
    let call = 0;
    const auditWebsite = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill: vi.fn() }),
      runLighthouse: async (_url, _flags, config) => {
        call += 1;
        if (call === 1) throw new Error("temporary failure");
        return {
          lhr: makeLighthouseResult({
            formFactor:
              config?.settings?.formFactor === "desktop"
                ? "desktop"
                : "mobile",
          }),
        };
      },
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence: async () => makeSiteIntelligence(),
    });

    const report = await auditWebsite(
      new URL("https://example.com"),
      "reliable",
    );

    expect(report.status).toBe("complete");
    expect(report.profiles.mobile.successfulRuns).toBe(2);
    expect(report.profiles.mobile.failures).toEqual(["temporary failure"]);
  });

  it("rejects when all profile runs fail and still terminates Chrome", async () => {
    const kill = vi.fn();
    const auditWebsite = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill }),
      runLighthouse: async () => {
        throw new Error("audit failed");
      },
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence: async () => makeSiteIntelligence(),
    });

    await expect(
      auditWebsite(new URL("https://example.com"), "fast"),
    ).rejects.toThrow(/No Lighthouse profile/i);
    expect(kill).toHaveBeenCalledTimes(2);
  });
});

function makeSiteIntelligence() {
  return {
    status: "complete",
    inspectedUrl: "https://example.com/",
    fetchedResources: {
      html: {
        url: "https://example.com/",
        statusCode: 200,
        ok: true,
        contentType: "text/html",
        finalUrl: "https://example.com/",
        error: null,
      },
      robotsTxt: null,
      sitemapXml: null,
    },
    checks: [],
    llmsTxt: {
      status: "generated",
      text: "# Example",
      evidence: ["Used document title."],
    },
    prioritizedIssues: [],
  } as const;
}
