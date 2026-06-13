import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

import { formatAuditReport, type LighthouseReport } from "./report.js";

interface ChromeProcess {
  port: number;
  kill: () => void;
}

interface WebsiteAuditorDependencies {
  launchChrome: (
    options: chromeLauncher.Options,
  ) => Promise<ChromeProcess>;
  runLighthouse: (
    url: string,
    flags: NonNullable<Parameters<typeof lighthouse>[1]>,
  ) => Promise<{ lhr: unknown } | undefined>;
}

/**
 * Runs Lighthouse in an isolated Chrome process and returns a Markdown summary.
 */
export const auditWebsite = createWebsiteAuditor({
  launchChrome: chromeLauncher.launch,
  runLighthouse: lighthouse,
});

/**
 * Builds a website auditor with replaceable process boundaries for testing.
 */
export function createWebsiteAuditor(
  dependencies: WebsiteAuditorDependencies,
): (url: URL) => Promise<string> {
  return async (url: URL): Promise<string> => {
    let chrome: ChromeProcess | undefined;

    try {
      chrome = await dependencies.launchChrome({
        chromeFlags: buildChromeFlags(),
        logLevel: "silent",
      });

      const runnerResult = await dependencies.runLighthouse(url.href, {
        logLevel: "silent",
        output: "json",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        port: chrome.port,
      });

      if (!runnerResult?.lhr) {
        throw new Error("Lighthouse did not produce a valid report.");
      }

      return formatAuditReport(
        url.href,
        runnerResult.lhr as LighthouseReport,
      );
    } finally {
      if (chrome) {
        try {
          chrome.kill();
        } catch (error) {
          console.error("Failed to terminate the Chrome process:", error);
        }
      }
    }
  };
}

function buildChromeFlags(): string[] {
  const flags = ["--headless=new", "--disable-dev-shm-usage"];

  if (process.env.LIGHTHOUSE_CHROME_NO_SANDBOX === "true") {
    flags.push("--no-sandbox");
  }

  return flags;
}
