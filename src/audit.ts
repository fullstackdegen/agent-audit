import * as chromeLauncher from "chrome-launcher";
import lighthouse, { type Config, type Flags, type Result } from "lighthouse";

import { getAuditProfiles } from "./profiles.js";
import {
  buildAgentReadyReport,
  type CollectedProfileRuns,
} from "./report-builder.js";
import type {
  AgentReadyLighthouseReport,
  AuditMode,
  ProfileName,
  SiteIntelligenceReport,
} from "./report-schema.js";
import {
  analyzeSiteIntelligence as runSiteIntelligence,
  type AnalyzeSiteIntelligence,
} from "./site-intelligence.js";
import { assertPublicHttpUrl } from "./url-policy.js";

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
    flags: Flags,
    config?: Config,
  ) => Promise<{ lhr: Result } | undefined>;
  validateUrl: (input: unknown) => Promise<URL>;
  now: () => Date;
  analyzeSiteIntelligence: AnalyzeSiteIntelligence;
}

export type AuditWebsite = (
  url: URL,
  mode: AuditMode,
) => Promise<AgentReadyLighthouseReport>;

export const auditWebsite = createWebsiteAuditor({
  launchChrome: chromeLauncher.launch,
  runLighthouse: async (url, flags, config) => lighthouse(url, flags, config),
  validateUrl: assertPublicHttpUrl,
  now: () => new Date(),
  analyzeSiteIntelligence: runSiteIntelligence,
});

/**
 * Builds a deterministic mobile and desktop Lighthouse audit coordinator.
 */
export function createWebsiteAuditor(
  dependencies: WebsiteAuditorDependencies,
): AuditWebsite {
  return async (
    requestedUrl: URL,
    mode: AuditMode,
  ): Promise<AgentReadyLighthouseReport> => {
    const attemptedRuns = mode === "reliable" ? 3 : 1;
    const profiles = {} as Record<ProfileName, CollectedProfileRuns>;

    for (const profile of getAuditProfiles()) {
      profiles[profile.name] = await collectProfileRuns(
        dependencies,
        requestedUrl,
        profile.name,
        profile.config,
        attemptedRuns,
      );
    }

    const siteIntelligence = await safeAnalyzeSiteIntelligence(
      dependencies,
      requestedUrl,
    );

    return buildAgentReadyReport({
      requestedUrl: requestedUrl.href,
      mode,
      generatedAt: dependencies.now(),
      siteIntelligence,
      profiles,
    });
  };
}

async function collectProfileRuns(
  dependencies: WebsiteAuditorDependencies,
  requestedUrl: URL,
  profile: ProfileName,
  config: Config | undefined,
  attemptedRuns: number,
): Promise<CollectedProfileRuns> {
  const runs: Result[] = [];
  const failures: string[] = [];
  let chrome: ChromeProcess | undefined;

  try {
    const validatedUrl = await dependencies.validateUrl(requestedUrl.href);
    chrome = await dependencies.launchChrome({
      chromeFlags: buildChromeFlags(),
      logLevel: "silent",
    });

    for (let runIndex = 0; runIndex < attemptedRuns; runIndex += 1) {
      try {
        const runnerResult = await dependencies.runLighthouse(
          validatedUrl.href,
          {
            logLevel: "silent",
            output: "json",
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
            port: chrome.port,
          },
          config,
        );
        if (!runnerResult?.lhr) {
          throw new Error(
            `Lighthouse did not produce a valid ${profile} report.`,
          );
        }
        runs.push(runnerResult.lhr);
      } catch (error) {
        failures.push(toFailureMessage(error));
      }
    }
  } catch (error) {
    failures.push(toFailureMessage(error));
  } finally {
    if (chrome) {
      try {
        chrome.kill();
      } catch (error) {
        console.error("Failed to terminate the Chrome process:", error);
      }
    }
  }

  return { attemptedRuns, failures, runs };
}

async function safeAnalyzeSiteIntelligence(
  dependencies: WebsiteAuditorDependencies,
  requestedUrl: URL,
): Promise<SiteIntelligenceReport> {
  try {
    return await dependencies.analyzeSiteIntelligence(requestedUrl);
  } catch (error) {
    const message = toSiteIntelligenceFailureMessage(error);
    return {
      status: "failed",
      inspectedUrl: requestedUrl.href,
      fetchedResources: {
        html: {
          url: requestedUrl.href,
          statusCode: null,
          ok: false,
          contentType: null,
          finalUrl: requestedUrl.href,
          error: message,
        },
        robotsTxt: null,
        sitemapXml: null,
      },
      checks: [],
      llmsTxt: {
        status: "insufficient-content",
        text: null,
        evidence: [message],
      },
      prioritizedIssues: [],
    };
  }
}

function buildChromeFlags(): string[] {
  const flags = ["--headless=new", "--disable-dev-shm-usage"];
  if (process.env.LIGHTHOUSE_CHROME_NO_SANDBOX === "true") {
    flags.push("--no-sandbox");
  }
  return flags;
}

function toFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Lighthouse failure.";
}

function toSiteIntelligenceFailureMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Site intelligence analysis failed.";
}
