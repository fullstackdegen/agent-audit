import { describe, expect, it } from "vitest";

import { inspectHtml } from "../src/html-inspector.js";

describe("inspectHtml", () => {
  it("extracts metadata, headings, resources, links, images, and JSON-LD facts", () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <title> Example &amp; Site </title>
          <meta name="description" content="Fast &amp; useful &lt;summary&gt;">
          <meta NAME="robots" content="index, follow">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="/canonical">
          <link rel="stylesheet" href="styles/main.css">
          <link rel="preload stylesheet" href="/styles/critical.css">
          <script src="/app.js"></script>
          <script type="application/ld+json">
            { "name": "Example &amp; Site", "url": "https://example.com/" }
          </script>
        </head>
        <body>
          <h1> Welcome <span>Home &amp; Away</span> </h1>
          <h1>Second&#39;s &quot;Heading&quot;</h1>
          <a href="/about"> About <strong>us</strong> </a>
          <a href="mailto:hello@example.com">Email</a>
          <a>Missing href</a>
          <img src="images/photo.jpg" alt="Hero &amp; photo" width="640" height="480">
          <img src="/icon.svg" width="abc" height="20.5">
        </body>
      </html>
    `;

    expect(inspectHtml(html, new URL("https://example.com/path/page"))).toEqual({
      title: "Example & Site",
      description: "Fast & useful <summary>",
      robotsMeta: "index, follow",
      viewport: "width=device-width, initial-scale=1",
      canonicalUrl: "https://example.com/canonical",
      headings: {
        h1: ["Welcome Home & Away", "Second's \"Heading\""],
      },
      links: [
        {
          url: "https://example.com/about",
          text: "About us",
          kind: "http",
        },
        {
          url: "mailto:hello@example.com",
          text: "Email",
          kind: "unsupported",
        },
      ],
      images: [
        {
          src: "https://example.com/path/images/photo.jpg",
          alt: "Hero & photo",
          width: 640,
          height: 480,
        },
        {
          src: "https://example.com/icon.svg",
          alt: null,
          width: null,
          height: null,
        },
      ],
      scripts: ["https://example.com/app.js"],
      stylesheets: [
        "https://example.com/path/styles/main.css",
        "https://example.com/styles/critical.css",
      ],
      jsonLdBlocks: [
        {
          raw: "{ \"name\": \"Example & Site\", \"url\": \"https://example.com/\" }",
        },
      ],
    });
  });

  it("collapses whitespace, strips nested tags, decodes basic entities, and limits extracted text", () => {
    const longText = `Start ${"word ".repeat(100)}End`;
    const longJsonLd = `{"data":"${"x".repeat(6000)}"}`;
    const facts = inspectHtml(
      `
        <title>${longText}</title>
        <meta name="description" content="A &quot;quoted&quot; value">
        <h1> Alpha
          <span> &lt;Beta&gt; </span>
          Gamma
        </h1>
        <a href="https://external.test/">${longText}</a>
        <script type="application/ld+json">${longJsonLd}</script>
      `,
      new URL("https://example.com/"),
    );

    expect(facts.title).toHaveLength(300);
    expect(facts.title?.startsWith("Start word word")).toBe(true);
    expect(facts.description).toBe('A "quoted" value');
    expect(facts.headings.h1).toEqual(["Alpha <Beta> Gamma"]);
    expect(facts.links[0]).toEqual({
      url: "https://external.test/",
      text: expect.stringMatching(/^Start word word/),
      kind: "http",
    });
    expect(facts.links[0]?.text).toHaveLength(300);
    expect(facts.jsonLdBlocks[0]?.raw).toHaveLength(5000);
  });

  it("preserves angle-bracket text inside JSON-LD strings", () => {
    const facts = inspectHtml(
      `
        <script type="application/ld+json">
          { "description": "A < B > C", "encoded": "A &lt; B &gt; C" }
        </script>
      `,
      new URL("https://example.com/"),
    );

    expect(facts.jsonLdBlocks[0]?.raw).toContain('"description": "A < B > C"');
    expect(facts.jsonLdBlocks[0]?.raw).toContain('"encoded": "A < B > C"');
  });
});
