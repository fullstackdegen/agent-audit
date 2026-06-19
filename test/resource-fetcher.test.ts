import { describe, expect, it, vi } from "vitest";

import { createResourceFetcher } from "../src/resource-fetcher.js";

describe("createResourceFetcher", () => {
  it("fetches text and reports a successful summary", async () => {
    const fetch = vi.fn(async () => responseFor("Hello world", {
      url: "https://example.com/final",
      status: 200,
      ok: true,
      contentType: "text/html; charset=utf-8",
    }));
    const validateUrl = vi.fn(async (input) => new URL(String(input)));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl,
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(validateUrl).toHaveBeenNthCalledWith(1, "https://example.com/page");
    expect(validateUrl).toHaveBeenNthCalledWith(2, "https://example.com/final");
    expect(fetch).toHaveBeenCalledWith(new URL("https://example.com/page"), {
      redirect: "manual",
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({
      text: "Hello world",
      summary: {
        url: "https://example.com/page",
        statusCode: 200,
        ok: true,
        contentType: "text/html; charset=utf-8",
        finalUrl: "https://example.com/final",
        error: null,
      },
    });
  });

  it("returns a failed summary without fetching when URL validation fails", async () => {
    const fetch = vi.fn();
    const validateUrl = vi.fn(async () => {
      throw new Error("Unsafe URL.");
    });
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl,
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      text: null,
      summary: {
        url: "https://example.com/page",
        statusCode: null,
        ok: false,
        contentType: null,
        finalUrl: "https://example.com/page",
        error: "Unsafe URL.",
      },
    });
  });

  it("truncates response text to the configured byte limit and reports the truncation", async () => {
    const fetch = vi.fn(async () => responseFor("abcdef", {
      url: "https://example.com/page",
      status: 200,
      ok: true,
      contentType: "text/plain",
    }));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1_000,
      maxBytes: 3,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(result).toEqual({
      text: "abc",
      summary: {
        url: "https://example.com/page",
        statusCode: 200,
        ok: true,
        contentType: "text/plain",
        finalUrl: "https://example.com/page",
        error: "Response exceeded 3 bytes and was truncated.",
      },
    });
  });

  it("follows redirects by validating and fetching each intermediate location", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse("/next", {
        url: "https://example.com/start",
        status: 302,
      }))
      .mockResolvedValueOnce(responseFor("Redirected", {
        url: "https://example.com/next",
        status: 200,
        ok: true,
        contentType: "text/html",
      }));
    const validateUrl = vi.fn(async (input) => new URL(String(input)));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl,
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/start"));

    expect(validateUrl).toHaveBeenNthCalledWith(1, "https://example.com/start");
    expect(validateUrl).toHaveBeenNthCalledWith(2, "https://example.com/next");
    expect(fetch).toHaveBeenNthCalledWith(1, new URL("https://example.com/start"), {
      redirect: "manual",
      signal: expect.any(AbortSignal),
    });
    expect(fetch).toHaveBeenNthCalledWith(2, new URL("https://example.com/next"), {
      redirect: "manual",
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({
      text: "Redirected",
      summary: {
        url: "https://example.com/start",
        statusCode: 200,
        ok: true,
        contentType: "text/html",
        finalUrl: "https://example.com/next",
        error: null,
      },
    });
  });

  it("does not fetch an unsafe redirect target after validation fails", async () => {
    const cancel = vi.fn();
    const fetch = vi.fn(async () => redirectResponse("http://127.0.0.1/admin", {
      url: "https://example.com/start",
      status: 302,
      cancel,
    }));
    const validateUrl = vi.fn(async (input) => {
      const url = new URL(String(input));
      if (url.hostname === "127.0.0.1") {
        throw new Error("Unsafe redirect target.");
      }
      return url;
    });
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl,
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/start"));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      text: null,
      summary: {
        url: "https://example.com/start",
        statusCode: 302,
        ok: false,
        contentType: null,
        finalUrl: "http://127.0.0.1/admin",
        error: "Unsafe redirect target.",
      },
    });
  });

  it("returns a failed summary when the redirect limit is exceeded", async () => {
    const firstCancel = vi.fn();
    const secondCancel = vi.fn();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse("/second", {
        url: "https://example.com/first",
        status: 302,
        cancel: firstCancel,
      }))
      .mockResolvedValueOnce(redirectResponse("/third", {
        url: "https://example.com/second",
        status: 301,
        cancel: secondCancel,
      }));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 1,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/first"));

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(secondCancel).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      text: null,
      summary: {
        url: "https://example.com/first",
        statusCode: 301,
        ok: false,
        contentType: null,
        finalUrl: "https://example.com/third",
        error: "Maximum redirect limit of 1 exceeded.",
      },
    });
  });

  it("limits response text by bytes instead of UTF-16 string length", async () => {
    const cancel = vi.fn();
    const fetch = vi.fn(async () => responseFor("🙂a", {
      url: "https://example.com/page",
      status: 200,
      ok: true,
      contentType: "text/plain",
      cancel,
    }));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1_000,
      maxBytes: 4,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      text: "🙂",
      summary: {
        url: "https://example.com/page",
        statusCode: 200,
        ok: true,
        contentType: "text/plain",
        finalUrl: "https://example.com/page",
        error: "Response exceeded 4 bytes and was truncated.",
      },
    });
  });

  it("keeps truncated success summary when stream cancellation rejects", async () => {
    const fetch = vi.fn(async () => responseFor("abcdef", {
      url: "https://example.com/page",
      status: 200,
      ok: true,
      contentType: "text/plain",
      cancel: () => {
        throw new Error("cancel failed");
      },
    }));
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1_000,
      maxBytes: 3,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(result).toEqual({
      text: "abc",
      summary: {
        url: "https://example.com/page",
        statusCode: 200,
        ok: true,
        contentType: "text/plain",
        finalUrl: "https://example.com/page",
        error: "Response exceeded 3 bytes and was truncated.",
      },
    });
  });

  it("converts network errors to failed summaries", async () => {
    const fetch = vi.fn(async () => {
      throw new Error("connection reset");
    });
    const fetcher = createResourceFetcher({
      fetch: fetch as typeof globalThis.fetch,
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1_000,
      maxBytes: 1_000,
      maxRedirects: 3,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/page"));

    expect(result).toEqual({
      text: null,
      summary: {
        url: "https://example.com/page",
        statusCode: null,
        ok: false,
        contentType: null,
        finalUrl: "https://example.com/page",
        error: "connection reset",
      },
    });
  });
});

function responseFor(
  text: string,
  options: {
    url: string;
    status: number;
    ok: boolean;
    contentType: string | null;
    cancel?: () => void;
  },
): Response {
  return {
    ok: options.ok,
    status: options.status,
    url: options.url,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? options.contentType : null,
    },
    body: streamFor(text, options.cancel),
    text: async () => text,
  } as Response;
}

function redirectResponse(
  location: string,
  options: {
    url: string;
    status: number;
    cancel?: () => void;
  },
): Response {
  return {
    ok: false,
    status: options.status,
    url: options.url,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "location" ? location : null,
    },
    body: streamFor("", options.cancel),
    text: async () => "",
  } as Response;
}

function streamFor(text: string, cancel?: () => void): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      if (!cancel) {
        controller.close();
      }
    },
    cancel,
  });
}
