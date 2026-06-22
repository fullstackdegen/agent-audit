const PREPUBLISH_COMMAND =
  "npm test && npm run check && npm run build && npm run validate:release";

const { lighthouseReportOutputSchema, renderReportMarkdown } =
  await loadReportContracts();

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
    validatesJsonSchema(exampleJson, lighthouseReportOutputSchema),
    "Example JSON must satisfy the advertised output schema",
  );
  requireValue(
    exampleMarkdownMatchesRenderer(exampleJson, exampleMarkdown),
    "Example Markdown must match the canonical renderer output",
  );
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

async function loadReportContracts() {
  try {
    const [{ lighthouseReportOutputSchema }, { renderReportMarkdown }] =
      await Promise.all([
        import("../src/report-schema.js"),
        import("../src/markdown.js"),
      ]);
    return { lighthouseReportOutputSchema, renderReportMarkdown };
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }
    const [{ lighthouseReportOutputSchema }, { renderReportMarkdown }] =
      await Promise.all([
        import("../dist/report-schema.js"),
        import("../dist/markdown.js"),
      ]);
    return { lighthouseReportOutputSchema, renderReportMarkdown };
  }
}

function validatesJsonSchema(value, schema) {
  if ("anyOf" in schema) {
    return schema.anyOf.some((candidate) =>
      validatesJsonSchema(value, candidate),
    );
  }

  if ("const" in schema && !sameJsonValue(value, schema.const)) {
    return false;
  }

  if (schema.type !== undefined && !matchesJsonType(value, schema.type)) {
    return false;
  }

  if (schema.enum !== undefined) {
    return schema.enum.some((candidate) => sameJsonValue(value, candidate));
  }

  if (
    (schema.type === "number" || schema.type === "integer") &&
    schema.minimum !== undefined &&
    value < schema.minimum
  ) {
    return false;
  }

  if (schema.type === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      return false;
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      return false;
    }
    if (schema.uniqueItems === true && !hasUniqueJsonItems(value)) {
      return false;
    }
    if (schema.items !== undefined) {
      return value.every((item) => validatesJsonSchema(item, schema.items));
    }
  }

  if (schema.type === "object") {
    const properties = schema.properties ?? {};
    const required = schema.required ?? [];
    if (required.some((key) => !Object.hasOwn(value, key))) {
      return false;
    }
    if (
      schema.additionalProperties === false &&
      Object.keys(value).some((key) => !Object.hasOwn(properties, key))
    ) {
      return false;
    }
    return Object.entries(properties).every(
      ([key, propertySchema]) =>
        !Object.hasOwn(value, key) ||
        validatesJsonSchema(value[key], propertySchema),
    );
  }

  return true;
}

function exampleMarkdownMatchesRenderer(exampleJson, exampleMarkdown) {
  try {
    return exampleMarkdown === renderReportMarkdown(exampleJson);
  } catch {
    return false;
  }
}

function matchesJsonType(value, type) {
  switch (type) {
    case "array":
      return Array.isArray(value);
    case "boolean":
      return typeof value === "boolean";
    case "integer":
      return Number.isInteger(value);
    case "null":
      return value === null;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "object":
      return (
        value !== null && typeof value === "object" && !Array.isArray(value)
      );
    case "string":
      return typeof value === "string";
    default:
      throw new Error(`Unsupported JSON schema type: ${type}`);
  }
}

function hasUniqueJsonItems(values) {
  const seen = new Set();
  for (const value of values) {
    const key = JSON.stringify(value);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }
  return true;
}

function sameJsonValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
