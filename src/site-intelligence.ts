import { inspectHtml } from "./html-inspector.js";
import { generateLlmsTxt } from "./llms-txt.js";
import {
  createResourceFetcher,
  type FetchTextResult,
  type ResourceFetcher,
} from "./resource-fetcher.js";
import type {
  FetchSummary,
  SiteIntelligenceReport,
} from "./report-schema.js";
import { buildSiteFindings } from "./site-findings.js";
import { assertPublicHttpUrl } from "./url-policy.js";

export type AnalyzeSiteIntelligence = (
  url: URL,
) => Promise<SiteIntelligenceReport>;

export interface SiteIntelligenceAnalyzerDependencies {
  fetcher: ResourceFetcher;
  maxLinks: number;
  maxAssets: number;
}

export const analyzeSiteIntelligence = createSiteIntelligenceAnalyzer({
  fetcher: createResourceFetcher({
    fetch: globalThis.fetch,
    validateUrl: assertPublicHttpUrl,
    timeoutMs: 5000,
    maxBytes: 500_000,
    maxRedirects: 3,
  }),
  maxLinks: 25,
  maxAssets: 20,
});

export function createSiteIntelligenceAnalyzer(
  dependencies: SiteIntelligenceAnalyzerDependencies,
): AnalyzeSiteIntelligence {
  return async (url) => {
    const html = await dependencies.fetcher.fetchText(url);
    const htmlText = html.text;

    if (!hasHtmlText(htmlText)) {
      return {
        status: "failed",
        inspectedUrl: url.href,
        fetchedResources: {
          html: html.summary,
          robotsTxt: null,
          sitemapXml: null,
        },
        checks: [],
        llmsTxt: {
          status: "insufficient-content",
          text: null,
          evidence: ["HTML document could not be fetched."],
        },
        prioritizedIssues: [],
      };
    }

    const facts = inspectHtml(htmlText, url);
    const robotsTxtUrl = new URL("/robots.txt", url);
    const sitemapXmlUrl = new URL("/sitemap.xml", url);
    const [robotsTxt, sitemapXml] = await Promise.all([
      safeFetchText(dependencies.fetcher, robotsTxtUrl),
      safeFetchText(dependencies.fetcher, sitemapXmlUrl),
    ]);
    const probedUrls = await probePageResources({
      dependencies,
      inspectedUrl: url,
      links: facts.links
        .filter((link) => link.kind === "http")
        .map((link) => link.url),
      assets: [
        ...facts.images.map((image) => image.src),
        ...facts.scripts,
        ...facts.stylesheets,
      ],
      alreadyFetched: [robotsTxt.summary.url, sitemapXml.summary.url],
    });
    const llmsTxt = generateLlmsTxt(facts, url);
    const findings = buildSiteFindings({
      inspectedUrl: url,
      facts,
      resources: {
        html: html.summary,
        robotsTxt: robotsTxt.summary,
        sitemapXml: sitemapXml.summary,
        probedUrls,
      },
      llmsTxt,
    });

    return {
      status: "complete",
      inspectedUrl: url.href,
      fetchedResources: {
        html: html.summary,
        robotsTxt: robotsTxt.summary,
        sitemapXml: sitemapXml.summary,
      },
      checks: findings.checks,
      llmsTxt,
      prioritizedIssues: findings.prioritizedIssues,
    };
  };
}

function hasHtmlText(html: string | null): html is string {
  return html !== null && html.trim() !== "";
}

async function safeFetchText(
  fetcher: ResourceFetcher,
  url: URL,
): Promise<FetchTextResult> {
  try {
    return await fetcher.fetchText(url);
  } catch (error) {
    return {
      text: null,
      summary: {
        url: url.href,
        statusCode: null,
        ok: false,
        contentType: null,
        finalUrl: url.href,
        error: messageFrom(error),
      },
    };
  }
}

async function probePageResources(input: {
  dependencies: SiteIntelligenceAnalyzerDependencies;
  inspectedUrl: URL;
  links: string[];
  assets: string[];
  alreadyFetched: string[];
}): Promise<FetchSummary[]> {
  const linkUrls = selectProbeUrls({
    candidates: input.links,
    inspectedUrl: input.inspectedUrl,
    limit: input.dependencies.maxLinks,
    alreadyFetched: input.alreadyFetched,
  });
  const assetUrls = selectProbeUrls({
    candidates: input.assets,
    inspectedUrl: input.inspectedUrl,
    limit: input.dependencies.maxAssets,
    alreadyFetched: [...input.alreadyFetched, ...linkUrls.map((url) => url.href)],
  });
  const urls = [...linkUrls, ...assetUrls];
  const deduped = dedupeUrls(urls);
  const results = await Promise.all(
    deduped.map((url) => safeFetchText(input.dependencies.fetcher, url)),
  );

  return results.map((result) => result.summary);
}

function selectProbeUrls(input: {
  candidates: string[];
  inspectedUrl: URL;
  limit: number;
  alreadyFetched: string[];
}): URL[] {
  const selected: URL[] = [];
  const seen = new Set(input.alreadyFetched.map(normalizeUrlIdentity));

  for (const candidate of input.candidates) {
    if (selected.length >= input.limit) {
      break;
    }

    const parsed = parseSameOriginHttpUrl(candidate, input.inspectedUrl);
    if (parsed === null) {
      continue;
    }

    const identity = normalizeUrlIdentity(parsed.href);
    if (seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    selected.push(new URL(identity));
  }

  return selected;
}

function parseSameOriginHttpUrl(candidate: string, inspectedUrl: URL): URL | null {
  try {
    const parsed = new URL(candidate);
    parsed.hash = "";
    if (
      parsed.origin === inspectedUrl.origin &&
      (parsed.protocol === "http:" || parsed.protocol === "https:")
    ) {
      return parsed;
    }
  } catch {
    // Invalid URLs are ignored; probing only follows normalized HTTP(S) URLs.
  }

  return null;
}

function normalizeUrlIdentity(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.href;
}

function messageFrom(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function dedupeUrls(urls: URL[]): URL[] {
  const seen = new Set<string>();
  const deduped: URL[] = [];

  for (const url of urls) {
    if (seen.has(url.href)) {
      continue;
    }

    seen.add(url.href);
    deduped.push(url);
  }

  return deduped;
}
