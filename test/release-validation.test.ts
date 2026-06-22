import { describe, expect, it } from "vitest";

import { validateReleaseSurface } from "../scripts/release-validation.mjs";

describe("release surface validation", () => {
  it("reports missing metadata, obsolete limits, and oversized examples", () => {
    const failures = validateReleaseSurface({
      packageJson: {
        name: "old-package-name",
        description: "Old package promise.",
        bin: {},
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
      readme: "# Lighthouse MCP",
      contributing: "Preserve the 20-issue response limit.",
      exampleJson: {
        status: "complete",
        prioritizedIssues: Array.from({ length: 11 }, () => ({})),
      },
      exampleMarkdown: "# Lighthouse Implementation Report",
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "package.json name must be agent-audit",
        "package.json must expose the agent-audit binary",
        "package.json description must match the product promise",
        "package.json repository.url is required",
        "package.json homepage is required",
        "package.json bugs.url is required",
        "README must contain the product promise",
        "CONTRIBUTING must not reference the obsolete 20-issue limit",
        "Example report must contain at most 10 tasks",
      ]),
    );
  });

  it("accepts a complete release surface", () => {
    const failures = validateReleaseSurface({
      packageJson: {
        name: "agent-audit",
        description: "Turn Lighthouse audits into coding-agent fix packs.",
        bin: { "agent-audit": "dist/index.js" },
        repository: { url: "https://github.com/example/lighthouse-mcp.git" },
        homepage: "https://github.com/example/lighthouse-mcp#readme",
        bugs: { url: "https://github.com/example/lighthouse-mcp/issues" },
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
      readme: "Turn Lighthouse audits into coding-agent fix packs.",
      contributing: "Preserve the 10-issue response limit.",
      exampleJson: {
        status: "complete",
        target: { requestedUrl: "https://www.commalabs.co/tr" },
        environment: { generatedAt: "2026-06-14T12:00:00.000Z" },
        profiles: { mobile: {}, desktop: {} },
        prioritizedIssues: [],
      },
      exampleMarkdown: "# Lighthouse Implementation Report",
    });

    expect(failures).toEqual([]);
  });

  it("reports wrong package identity and missing agent-audit binary", () => {
    const failures = validateReleaseSurface({
      packageJson: {
        name: "mcp-server-lighthouse",
        description: "Turn Lighthouse audits into coding-agent fix packs.",
        bin: { "mcp-server-lighthouse": "dist/index.js" },
        repository: { url: "https://github.com/example/lighthouse-mcp.git" },
        homepage: "https://github.com/example/lighthouse-mcp#readme",
        bugs: { url: "https://github.com/example/lighthouse-mcp/issues" },
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
      readme: "Turn Lighthouse audits into coding-agent fix packs.",
      contributing: "Preserve the 10-issue response limit.",
      exampleJson: {
        status: "complete",
        target: { requestedUrl: "https://www.commalabs.co/tr" },
        environment: { generatedAt: "2026-06-14T12:00:00.000Z" },
        profiles: { mobile: {}, desktop: {} },
        prioritizedIssues: [],
      },
      exampleMarkdown: "# Lighthouse Implementation Report",
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "package.json name must be agent-audit",
        "package.json must expose the agent-audit binary",
      ]),
    );
  });
});
