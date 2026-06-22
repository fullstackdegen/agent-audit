const PREPUBLISH_COMMAND =
  "npm test && npm run check && npm run build && npm run validate:release";

export function validateReleaseSurface({
  packageJson,
  readme,
  contributing,
  exampleJson,
  exampleMarkdown,
}) {
  const failures = [];
  const requireValue = (condition, message) => {
    if (!condition) failures.push(message);
  };

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

  return failures;
}
