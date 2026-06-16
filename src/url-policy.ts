import { lookup } from "node:dns/promises";

import ipaddr from "ipaddr.js";

export interface ResolvedAddress {
  address: string;
  family: number;
}

export type ResolveHostname = (hostname: string) => Promise<ResolvedAddress[]>;

export interface UrlPolicyOptions {
  allowLocalhost?: boolean;
}

const LOCAL_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);
const BLOCKED_RANGES = new Set([
  "unspecified",
  "broadcast",
  "multicast",
  "linkLocal",
  "loopback",
  "private",
  "reserved",
  "uniqueLocal",
  "carrierGradeNat",
]);

/**
 * Reads the explicit development-mode localhost opt-in.
 */
export function isLocalhostAllowedFromEnv(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST === "true";
}

/**
 * Parses a user-supplied audit target and rejects obviously unsafe URL forms.
 *
 * DNS-backed policy checks are performed separately by {@link assertAuditTargetUrl}.
 */
export function parseAuditTargetUrl(
  input: unknown,
  options: UrlPolicyOptions = {},
): URL {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("The url argument must be a non-empty string.");
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("The url argument must be a fully qualified URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing embedded credentials are not supported.");
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname) {
    throw new Error("The url argument must include a hostname.");
  }

  if (ipaddr.isValid(hostname)) {
    if (isLoopbackAddress(hostname)) {
      assertLocalhostAllowed(options);
    } else {
      assertPublicAddress(hostname);
    }
    return url;
  }

  if (isLocalHostname(hostname)) {
    assertLocalhostAllowed(options);
  }

  return url;
}

/**
 * Parses a public target URL with the default production policy.
 */
export function parsePublicHttpUrl(input: unknown): URL {
  return parseAuditTargetUrl(input);
}

/**
 * Resolves a target hostname and verifies that every result is publicly routable.
 *
 * Call this immediately before browser navigation. Production deployments should
 * also enforce outbound network restrictions to mitigate DNS rebinding.
 */
export async function assertAuditTargetUrl(
  input: unknown,
  resolveHostname: ResolveHostname = resolveAllAddresses,
  options: UrlPolicyOptions = {
    allowLocalhost: isLocalhostAllowedFromEnv(),
  },
): Promise<URL> {
  const url = parseAuditTargetUrl(input, options);
  const hostname = normalizeHostname(url.hostname);

  if (isLocalHostname(hostname) || isLoopbackAddress(hostname)) {
    assertLocalhostAllowed(options);
    return url;
  }

  if (ipaddr.isValid(hostname)) {
    return url;
  }

  let addresses: ResolvedAddress[];
  try {
    addresses = await resolveHostname(hostname);
  } catch {
    throw new Error("The target hostname could not be resolved.");
  }

  if (addresses.length === 0) {
    throw new Error("The target hostname did not resolve to an IP address.");
  }

  for (const { address } of addresses) {
    assertPublicAddress(address);
  }

  return url;
}

/**
 * Resolves a target hostname and verifies that every result is publicly routable.
 */
export async function assertPublicHttpUrl(
  input: unknown,
  resolveHostname: ResolveHostname = resolveAllAddresses,
): Promise<URL> {
  return assertAuditTargetUrl(input, resolveHostname);
}

async function resolveAllAddresses(hostname: string): Promise<ResolvedAddress[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost");
}

function isLoopbackAddress(address: string): boolean {
  return ipaddr.isValid(address) && ipaddr.process(address).range() === "loopback";
}

function assertLocalhostAllowed(options: UrlPolicyOptions): void {
  if (!options.allowLocalhost) {
    throw new Error(
      "Localhost targets are disabled by default. Start the server with LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true to audit local development sites.",
    );
  }
}

function assertPublicAddress(address: string): void {
  if (!ipaddr.isValid(address)) {
    throw new Error("The target resolved to an invalid IP address.");
  }

  const parsed = ipaddr.process(address);
  if (BLOCKED_RANGES.has(parsed.range())) {
    throw new Error("The target must resolve exclusively to publicly routable addresses.");
  }
}
