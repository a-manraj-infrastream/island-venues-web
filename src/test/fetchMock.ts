import { vi } from 'vitest';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/**
 * Replaces global fetch with a spy driven by `handler`. Restored after each
 * test by `unstubGlobals: true` in vite.config.ts.
 */
export function mockFetch(handler: Handler) {
  const spy = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init ?? {})),
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

/** Routes by "METHOD path"; anything unrouted fails the test loudly with a 599. */
export function routes(table: Record<string, () => Response | Promise<Response>>): Handler {
  return (url, init) => {
    const key = `${init.method ?? 'GET'} ${url}`;
    const route = table[key];
    if (!route) return jsonResponse({ error: `unexpected request ${key}` }, 599);
    return route();
  };
}
