export interface HtmlFacts {
  title: string | null;
  description: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  canonicalUrl: string | null;
  headings: { h1: string[] };
  links: Array<{ url: string; text: string; kind: "http" | "unsupported" }>;
  images: Array<{
    src: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  }>;
  scripts: string[];
  stylesheets: string[];
  jsonLdBlocks: Array<{ raw: string }>;
}

const NORMAL_TEXT_LIMIT = 300;
const JSON_LD_TEXT_LIMIT = 5000;

export function inspectHtml(html: string, baseUrl: URL): HtmlFacts {
  const title = extractFirstText(html, /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  const meta = extractMeta(html);
  const links = extractLinkTags(html, baseUrl);
  const scripts = extractScripts(html, baseUrl);

  return {
    title,
    description: meta.description,
    robotsMeta: meta.robots,
    viewport: meta.viewport,
    canonicalUrl: links.canonicalUrl,
    headings: {
      h1: extractAllText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi),
    },
    links: extractAnchors(html, baseUrl),
    images: extractImages(html, baseUrl),
    scripts: scripts.srcs,
    stylesheets: links.stylesheets,
    jsonLdBlocks: scripts.jsonLdBlocks,
  };
}

function extractMeta(html: string): {
  description: string | null;
  robots: string | null;
  viewport: string | null;
} {
  const meta = {
    description: null as string | null,
    robots: null as string | null,
    viewport: null as string | null,
  };
  const metaTagPattern = /<meta\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaTagPattern.exec(html)) !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const name = attributes.get("name")?.toLowerCase();
    const content = attributes.get("content");

    if (
      content === undefined ||
      (name !== "description" && name !== "robots" && name !== "viewport")
    ) {
      continue;
    }

    meta[name] ??= normalizeText(content);
  }

  return meta;
}

function extractLinkTags(
  html: string,
  baseUrl: URL,
): { canonicalUrl: string | null; stylesheets: string[] } {
  let canonicalUrl: string | null = null;
  const stylesheets: string[] = [];
  const linkTagPattern = /<link\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkTagPattern.exec(html)) !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const relTokens = (attributes.get("rel") ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const href = attributes.get("href");

    if (href === undefined) {
      continue;
    }

    const resolvedHref = resolveUrl(decodeBasicEntities(href), baseUrl);

    if (canonicalUrl === null && relTokens.includes("canonical")) {
      canonicalUrl = resolvedHref;
    }

    if (relTokens.includes("stylesheet")) {
      stylesheets.push(resolvedHref);
    }
  }

  return { canonicalUrl, stylesheets };
}

function extractAnchors(
  html: string,
  baseUrl: URL,
): HtmlFacts["links"] {
  const anchors: HtmlFacts["links"] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const href = attributes.get("href");

    if (href === undefined) {
      continue;
    }

    const resolvedHref = resolveUrl(decodeBasicEntities(href), baseUrl);
    anchors.push({
      url: resolvedHref,
      text: normalizeText(match[2] ?? ""),
      kind: isHttpUrl(resolvedHref) ? "http" : "unsupported",
    });
  }

  return anchors;
}

function extractImages(html: string, baseUrl: URL): HtmlFacts["images"] {
  const images: HtmlFacts["images"] = [];
  const imagePattern = /<img\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(html)) !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const src = attributes.get("src");

    if (src === undefined) {
      continue;
    }

    images.push({
      src: resolveUrl(decodeBasicEntities(src), baseUrl),
      alt: attributes.has("alt") ? normalizeText(attributes.get("alt") ?? "") : null,
      width: parseIntegerAttribute(attributes.get("width")),
      height: parseIntegerAttribute(attributes.get("height")),
    });
  }

  return images;
}

function extractScripts(
  html: string,
  baseUrl: URL,
): { srcs: string[]; jsonLdBlocks: Array<{ raw: string }> } {
  const srcs: string[] = [];
  const jsonLdBlocks: Array<{ raw: string }> = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const src = attributes.get("src");
    const type = attributes.get("type")?.toLowerCase().split(";")[0]?.trim();

    if (src !== undefined) {
      srcs.push(resolveUrl(decodeBasicEntities(src), baseUrl));
    }

    if (type === "application/ld+json") {
      jsonLdBlocks.push({
        raw: normalizeJsonLd(match[2] ?? ""),
      });
    }
  }

  return { srcs, jsonLdBlocks };
}

function extractFirstText(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match ? normalizeText(match[1] ?? "") : null;
}

function extractAllText(html: string, pattern: RegExp): string[] {
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    values.push(normalizeText(match[1] ?? ""));
  }

  return values;
}

function parseAttributes(source: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern =
    /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(source)) !== null) {
    const name = match[1]?.toLowerCase();

    if (name === undefined) {
      continue;
    }

    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? "");
  }

  return attributes;
}

function normalizeText(value: string, limit = NORMAL_TEXT_LIMIT): string {
  return decodeBasicEntities(stripTags(value))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function normalizeJsonLd(value: string): string {
  return decodeBasicEntities(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, JSON_LD_TEXT_LIMIT);
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function resolveUrl(value: string, baseUrl: URL): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseIntegerAttribute(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}
