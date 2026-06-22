const PREPUBLISH_COMMAND =
  "npm test && npm run check && npm run build && npm run validate:release";

export function validateReleaseSurface({
  packageJson,
  readme,
  contributing,
  exampleJson,
  exampleMarkdown,
  overviewSvg,
}) {
  const failures = [];
  const requireValue = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const hasStalePublicBranding = (value) =>
    value.includes("mcp-server-lighthouse") || value.includes("Lighthouse MCP");

  requireValue(
    packageJson.name === "agent-audit",
    "package.json name must be agent-audit",
  );
  requireValue(
    packageJson.bin?.["agent-audit"] === "dist/index.js",
    "package.json must expose the agent-audit binary",
  );
  requireValue(
    packageJson.description === "Turn Lighthouse audits into coding-agent fix packs.",
    "package.json description must match the product promise",
  );
  requireValue(
    packageJson.repository?.url,
    "package.json repository.url is required",
  );
  requireValue(packageJson.homepage, "package.json homepage is required");
  requireValue(packageJson.bugs?.url, "package.json bugs.url is required");
  requireValue(
    packageJson.scripts?.prepublishOnly === PREPUBLISH_COMMAND,
    "prepublishOnly must run every release gate",
  );
  requireValue(
    readme.includes("Turn Lighthouse audits into coding-agent fix packs."),
    "README must contain the product promise",
  );
  requireValue(
    !hasStalePublicBranding(readme),
    "README must not contain stale Lighthouse MCP branding",
  );
  requireValue(
    !contributing.includes("20-issue"),
    "CONTRIBUTING must not reference the obsolete 20-issue limit",
  );
  requireValue(
    exampleJson.status === "complete",
    "Example report must be complete",
  );
  requireValue(
    Array.isArray(exampleJson.prioritizedIssues) &&
      exampleJson.prioritizedIssues.length <= 10,
    "Example report must contain at most 10 tasks",
  );
  requireValue(
    Array.isArray(exampleJson.fixPacks) &&
      Array.isArray(exampleJson.prioritizedIssues) &&
      exampleJson.fixPacks.length === exampleJson.prioritizedIssues.length,
    "Example report must include one fix pack per prioritized issue",
  );
  requireValue(
    exampleJson.environment?.generatedAt?.startsWith("2026-06-14"),
    "Example must contain its canonical capture timestamp",
  );
  requireValue(
    exampleJson.target?.requestedUrl === "https://www.commalabs.co/tr",
    "Example target must be CommaLabs",
  );
  requireValue(
    exampleJson.profiles?.mobile && exampleJson.profiles?.desktop,
    "Example must contain mobile and desktop profiles",
  );
  requireValue(
    exampleMarkdown.includes("# Lighthouse Implementation Report"),
    "Example Markdown report is invalid",
  );
  requireValue(
    exampleMarkdown.includes("## Agent Fix Packs"),
    "Example Markdown report must include agent fix packs",
  );
  requireValue(
    !hasStalePublicBranding(exampleMarkdown),
    "Example Markdown must not contain stale Lighthouse MCP branding",
  );
  requireValue(
    !hasStalePublicBranding(JSON.stringify(exampleJson)),
    "Example JSON must not contain stale Lighthouse MCP branding",
  );
  if (overviewSvg !== undefined) {
    requireValue(
      !hasStalePublicBranding(overviewSvg),
      "Overview SVG must not contain stale Lighthouse MCP branding",
    );
  }

  return failures;
}
