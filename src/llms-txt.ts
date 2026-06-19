import type { HtmlFacts } from "./html-inspector.js";
import type { LlmsTxtReport } from "./report-schema.js";

const MAX_LINKS = 5;

export function generateLlmsTxt(
  facts: HtmlFacts,
  inspectedUrl: URL,
): LlmsTxtReport {
  const evidence: string[] = [];

  if (facts.title === null && facts.description === null) {
    return {
      status: "insufficient-content",
      text: null,
      evidence: ["Missing document title.", "Missing meta description."],
    };
  }

  const title = escapeMarkdownText(selectTitle(facts, inspectedUrl, evidence));
  const primaryUrl = selectPrimaryUrl(facts.canonicalUrl, inspectedUrl, evidence);

  const lines = [`# ${title}`, "", `Source: ${primaryUrl}`];

  if (facts.description !== null) {
    lines.push("", `> ${escapeMarkdownText(facts.description)}`);
    evidence.push("Used meta description.");
  } else {
    evidence.push("Missing meta description.");
  }

  const sameOriginLinks = selectSameOriginLinks(facts.links, inspectedUrl);
  evidence.push(
    `Included ${sameOriginLinks.length} same-origin HTTP link${sameOriginLinks.length === 1 ? "" : "s"}.`,
  );

  if (sameOriginLinks.length > 0) {
    lines.push("", "## Same-origin links");
    for (const link of sameOriginLinks) {
      const label = escapeMarkdownText(link.text) || link.url;
      lines.push(`- [${label}](${link.url})`);
    }
  }

  return {
    status: "generated",
    text: lines.join("\n"),
    evidence,
  };
}

function selectTitle(
  facts: HtmlFacts,
  inspectedUrl: URL,
  evidence: string[],
): string {
  if (facts.title !== null) {
    evidence.push("Used document title.");
    return facts.title;
  }

  const h1 = facts.headings.h1.find((heading) => heading.length > 0);
  if (h1 !== undefined) {
    evidence.push("Missing document title; used first H1.");
    return h1;
  }

  evidence.push("Missing document title and H1; used hostname.");
  return inspectedUrl.hostname;
}

function selectPrimaryUrl(
  canonicalUrl: string | null,
  inspectedUrl: URL,
  evidence: string[],
): string {
  if (canonicalUrl === null) {
    evidence.push("Used inspected URL as primary page URL.");
    return inspectedUrl.href;
  }

  try {
    const parsed = new URL(canonicalUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      evidence.push("Used canonical URL as primary page URL.");
      return parsed.href;
    }
  } catch {
    // Fall through to the inspected URL.
  }

  evidence.push("Ignored invalid canonical URL; used inspected URL as primary page URL.");
  return inspectedUrl.href;
}

function selectSameOriginLinks(
  links: HtmlFacts["links"],
  inspectedUrl: URL,
): Array<{ url: string; text: string }> {
  const selected: Array<{ url: string; text: string }> = [];

  for (const link of links) {
    if (selected.length >= MAX_LINKS || link.kind !== "http") {
      continue;
    }

    try {
      const url = new URL(link.url);
      if (url.origin === inspectedUrl.origin) {
        selected.push({ url: url.href, text: link.text });
      }
    } catch {
      // Invalid URLs are ignored because llms.txt should only include verified facts.
    }
  }

  return selected;
}

function escapeMarkdownText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\`*_{}\[\]()#+!|>]/g, "\\$&");
}
