import { readFile } from "node:fs/promises";

import { validateReleaseSurface } from "./release-validation.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

try {
  const failures = validateReleaseSurface({
    packageJson: await readJson("package.json"),
    readme: await readFile("README.md", "utf8"),
    contributing: await readFile("CONTRIBUTING.md", "utf8"),
    exampleJson: await readJson("examples/commalabs-fast-report.json"),
    exampleMarkdown: await readFile(
      "examples/commalabs-fast-report.md",
      "utf8",
    ),
    overviewSvg: await readFile("docs/assets/lighthouse-mcp-overview.svg", "utf8"),
  });

  if (failures.length > 0) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Release surface is valid.");
  }
} catch (error) {
  console.error(`Release validation failed: ${error.message}`);
  process.exitCode = 1;
}
