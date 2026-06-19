import type { FetchSummary } from "./report-schema.js";

export interface ResourceFetcherDependencies {
  fetch: typeof fetch;
  validateUrl: (input: unknown) => Promise<URL>;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
}

export interface FetchTextResult {
  text: string | null;
  summary: FetchSummary;
}

export interface ResourceFetcher {
  fetchText: (url: URL) => Promise<FetchTextResult>;
}

export function createResourceFetcher(
  dependencies: ResourceFetcherDependencies,
): ResourceFetcher {
  return {
    fetchText: async (url) => {
      const requestedUrl = url.href;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), dependencies.timeoutMs);
      let currentUrl = requestedUrl;
      let redirectCount = 0;

      try {
        while (true) {
          let validated: URL;
          try {
            validated = await dependencies.validateUrl(currentUrl);
          } catch (error) {
            return {
              text: null,
              summary: failedSummary(requestedUrl, currentUrl, messageFrom(error)),
            };
          }

          const response = await dependencies.fetch(validated, {
            redirect: "manual",
            signal: controller.signal,
          });
          const finalResponseUrl = response.url || validated.href;

          if (isRedirect(response.status)) {
            const location = response.headers.get("location");
            if (location) {
              let redirectUrl: URL;
              try {
                redirectUrl = new URL(location, validated);
              } catch (error) {
                await cancelBody(response);
                return {
                  text: null,
                  summary: {
                    url: requestedUrl,
                    statusCode: response.status,
                    ok: false,
                    contentType: response.headers.get("content-type"),
                    finalUrl: location,
                    error: messageFrom(error),
                  },
                };
              }
              currentUrl = redirectUrl.href;

              if (redirectCount >= dependencies.maxRedirects) {
                await cancelBody(response);
                return {
                  text: null,
                  summary: {
                    url: requestedUrl,
                    statusCode: response.status,
                    ok: false,
                    contentType: response.headers.get("content-type"),
                    finalUrl: currentUrl,
                    error: `Maximum redirect limit of ${dependencies.maxRedirects} exceeded.`,
                  },
                };
              }

              try {
                await dependencies.validateUrl(currentUrl);
              } catch (error) {
                await cancelBody(response);
                return {
                  text: null,
                  summary: {
                    url: requestedUrl,
                    statusCode: response.status,
                    ok: false,
                    contentType: response.headers.get("content-type"),
                    finalUrl: currentUrl,
                    error: messageFrom(error),
                  },
                };
              }

              redirectCount += 1;
              await cancelBody(response);
              continue;
            }
          }

          let finalUrl: URL;
          try {
            finalUrl = await dependencies.validateUrl(finalResponseUrl);
          } catch (error) {
            await cancelBody(response);
            return {
              text: null,
              summary: {
                url: requestedUrl,
                statusCode: response.status,
                ok: false,
                contentType: response.headers.get("content-type"),
                finalUrl: finalResponseUrl,
                error: messageFrom(error),
              },
            };
          }

          const body = await readBoundedText(response, dependencies.maxBytes);

          return {
            text: body.text,
            summary: {
              url: requestedUrl,
              statusCode: response.status,
              ok: response.ok,
              contentType: response.headers.get("content-type"),
              finalUrl: finalUrl.href,
              error: body.truncated
                ? `Response exceeded ${dependencies.maxBytes} bytes and was truncated.`
                : null,
            },
          };
        }
      } catch (error) {
        return {
          text: null,
          summary: failedSummary(
            requestedUrl,
            currentUrl,
            controller.signal.aborted ? "The resource fetch timed out." : messageFrom(error),
          ),
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function isRedirect(statusCode: number): boolean {
  return statusCode >= 300 && statusCode < 400;
}

async function readBoundedText(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) {
    return { text: "", truncated: false };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return {
          text: decodeChunks(chunks),
          truncated: false,
        };
      }

      if (!value) {
        continue;
      }

      const remainingBytes = maxBytes - bytesRead;
      if (value.byteLength > remainingBytes) {
        if (remainingBytes > 0) {
          chunks.push(value.slice(0, remainingBytes));
        }
        await reader.cancel().catch(() => undefined);
        return {
          text: decodeChunks(chunks),
          truncated: true,
        };
      }

      chunks.push(value);
      bytesRead += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

function decodeChunks(chunks: Uint8Array[]): string {
  return new TextDecoder().decode(concatenate(chunks));
}

function concatenate(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cleanup failures should not replace the fetch summary error.
  }
}

function failedSummary(
  url: string,
  finalUrl: string,
  error: string,
): FetchSummary {
  return {
    url,
    statusCode: null,
    ok: false,
    contentType: null,
    finalUrl,
    error,
  };
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
