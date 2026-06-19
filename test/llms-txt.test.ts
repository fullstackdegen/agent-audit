import { describe, expect, it } from "vitest";

import { generateLlmsTxt } from "../src/llms-txt.js";
import type { HtmlFacts } from "../src/html-inspector.js";

describe("generateLlmsTxt", () => {
  it("generates a conservative llms.txt draft from page facts", () => {
    const report = generateLlmsTxt(
      {
        title: "Example Store",
        description: "Premium example products.",
        canonicalUrl: "https://example.com/",
        headings: { h1: ["Example Store"] },
        links: [
          {
            url: "https://example.com/products/a",
            text: "Product A",
            kind: "http",
          },
          { url: "https://external.test/", text: "External", kind: "http" },
        ],
        images: [],
        scripts: [],
        stylesheets: [],
        robotsMeta: null,
        viewport: null,
        jsonLdBlocks: [],
      } satisfies HtmlFacts,
      new URL("https://example.com/"),
    );

    expect(report.status).toBe("generated");
    expect(report.text).toContain("# Example Store");
    expect(report.text).toContain("> Premium example products.");
    expect(report.text).toContain(
      "- [Product A](https://example.com/products/a)",
    );
    expect(report.text).not.toContain("external.test");
  });

  it("returns insufficient-content instead of hallucinating", () => {
    const report = generateLlmsTxt(
      {
        title: null,
        description: null,
        canonicalUrl: null,
        headings: { h1: [] },
        links: [],
        images: [],
        scripts: [],
        stylesheets: [],
        robotsMeta: null,
        viewport: null,
        jsonLdBlocks: [],
      } satisfies HtmlFacts,
      new URL("https://example.com/"),
    );

    expect(report).toEqual({
      status: "insufficient-content",
      text: null,
      evidence: ["Missing document title.", "Missing meta description."],
    });
  });

  it("escapes Markdown-sensitive page text as plain text", () => {
    const report = generateLlmsTxt(
      {
        title: "[Injected](https://evil.test)",
        description: "Real description.\n- [Fake](https://evil.test)",
        canonicalUrl: "https://example.com/",
        headings: { h1: [] },
        links: [
          {
            url: "https://example.com/docs",
            text: "Docs](https://evil.test)",
            kind: "http",
          },
        ],
        images: [],
        scripts: [],
        stylesheets: [],
        robotsMeta: null,
        viewport: null,
        jsonLdBlocks: [],
      } satisfies HtmlFacts,
      new URL("https://example.com/"),
    );

    expect(report.text).toContain("# \\[Injected\\]\\(https://evil.test\\)");
    expect(report.text).toContain(
      "> Real description. - \\[Fake\\]\\(https://evil.test\\)",
    );
    expect(report.text).toContain(
      "- [Docs\\]\\(https://evil.test\\)](https://example.com/docs)",
    );
    expect(report.text).not.toContain("[Injected](https://evil.test)");
    expect(report.text).not.toContain("- [Fake](https://evil.test)");
    expect(report.text).not.toContain("[Docs](https://evil.test)");
  });

  it("falls back to inspected URL for malformed or non-http canonical URLs", () => {
    const malformed = generateLlmsTxt(
      {
        title: "Example Store",
        description: "Premium example products.",
        canonicalUrl: "://not-a-url",
        headings: { h1: [] },
        links: [],
        images: [],
        scripts: [],
        stylesheets: [],
        robotsMeta: null,
        viewport: null,
        jsonLdBlocks: [],
      } satisfies HtmlFacts,
      new URL("https://example.com/inspected"),
    );
    const nonHttp = generateLlmsTxt(
      {
        title: "Example Store",
        description: "Premium example products.",
        canonicalUrl: "javascript:alert(1)",
        headings: { h1: [] },
        links: [],
        images: [],
        scripts: [],
        stylesheets: [],
        robotsMeta: null,
        viewport: null,
        jsonLdBlocks: [],
      } satisfies HtmlFacts,
      new URL("https://example.com/inspected"),
    );

    expect(malformed.text).toContain("Source: https://example.com/inspected");
    expect(malformed.text).not.toContain("://not-a-url");
    expect(nonHttp.text).toContain("Source: https://example.com/inspected");
    expect(nonHttp.text).not.toContain("javascript:alert(1)");
  });
});
