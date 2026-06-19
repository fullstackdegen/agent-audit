import { describe, expect, it, vi } from "vitest";

import { createSiteIntelligenceAnalyzer } from "../src/site-intelligence.js";

describe("createSiteIntelligenceAnalyzer", () => {
  it("fetches the inspected page and well-known resources, then returns site intelligence", async () => {
    const fetchText = vi.fn(async (url: URL) => {
      if (url.pathname === "/robots.txt") {
        return {
          text: "User-agent: *\nAllow: /",
          summary: summary(url.href, 200, true),
        };
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          text: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
          summary: summary(url.href, 200, true),
        };
      }
      if (url.pathname === "/missing") {
        return { text: "not found", summary: summary(url.href, 404, false) };
      }
      return {
        text: `<title>Example</title>
          <meta name="description" content="Example page">
          <a href="/missing">Missing</a>`,
        summary: summary(url.href, 200, true),
      };
    });
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: { fetchText },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("complete");
    expect(report.inspectedUrl).toBe("https://example.com/");
    expect(report.fetchedResources.robotsTxt?.ok).toBe(true);
    expect(report.fetchedResources.sitemapXml?.ok).toBe(true);
    expect(report.checks.map((check) => check.id)).toContain("site-broken-link");
    expect(report.llmsTxt.status).toBe("generated");
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/"));
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/robots.txt"));
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/sitemap.xml"));
  });

  it("returns failed site intelligence when HTML cannot be fetched", async () => {
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: {
        fetchText: vi.fn(async (url: URL) => ({
          text: null,
          summary: {
            url: url.href,
            statusCode: null,
            ok: false,
            contentType: null,
            finalUrl: url.href,
            error: "blocked",
          },
        })),
      },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("failed");
    expect(report.fetchedResources.html.error).toBe("blocked");
    expect(report.prioritizedIssues).toEqual([]);
  });

  it("returns failed site intelligence when fetched HTML is whitespace-only", async () => {
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: {
        fetchText: vi.fn(async (url: URL) => ({
          text: " \n\t ",
          summary: summary(url.href, 200, true),
        })),
      },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("failed");
    expect(report.llmsTxt).toEqual({
      status: "insufficient-content",
      text: null,
      evidence: ["HTML document could not be fetched."],
    });
    expect(report.prioritizedIssues).toEqual([]);
  });

  it("keeps analysis complete when secondary resource fetches reject", async () => {
    const fetchText = vi.fn(async (url: URL) => {
      if (url.pathname === "/robots.txt") {
        throw new Error("robots blocked");
      }
      if (url.pathname === "/broken-probe") {
        throw new TypeError("probe blocked");
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          text: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
          summary: summary(url.href, 200, true),
        };
      }

      return {
        text: `<title>Example</title>
          <meta name="description" content="Example page">
          <a href="/broken-probe">Broken probe</a>`,
        summary: summary(url.href, 200, true),
      };
    });
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: { fetchText },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("complete");
    expect(report.fetchedResources.robotsTxt).toEqual({
      url: "https://example.com/robots.txt",
      statusCode: null,
      ok: false,
      contentType: null,
      finalUrl: "https://example.com/robots.txt",
      error: "robots blocked",
    });
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/broken-probe"));
  });

  it("dedupes normalized probe URLs before applying link and asset limits", async () => {
    const fetchText = vi.fn(async (url: URL) => {
      if (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml") {
        return {
          text: "",
          summary: summary(url.href, 200, true),
        };
      }

      return {
        text: `<title>Example</title>
          <meta name="description" content="Example page">
          <a href="/duplicate#one">Duplicate one</a>
          <a href="/duplicate#two">Duplicate two</a>
          <a href="/second">Second</a>
          <a href="/third">Third</a>
          <a href="/robots.txt#again">Robots again</a>
          <a href="https://other.example/external">External</a>
          <img src="/second#image">
          <img src="/asset#image">
          <script src="/asset#script"></script>
          <link rel="stylesheet" href="/style#sheet">`,
        summary: summary(url.href, 200, true),
      };
    });
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: { fetchText },
      maxLinks: 2,
      maxAssets: 2,
    });

    await analyzer(new URL("https://example.com/"));

    expect(fetchText.mock.calls.map(([url]) => url.href)).toEqual([
      "https://example.com/",
      "https://example.com/robots.txt",
      "https://example.com/sitemap.xml",
      "https://example.com/duplicate",
      "https://example.com/second",
      "https://example.com/asset",
      "https://example.com/style",
    ]);
  });
});

function summary(url: string, statusCode: number, ok: boolean) {
  return {
    url,
    statusCode,
    ok,
    contentType: "text/html",
    finalUrl: url,
    error: null,
  };
}
