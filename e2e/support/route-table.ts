import type { Page, Route } from '@playwright/test';

export interface MockRequest {
  params: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string | null;
  url: string;
}

type Handler = (req: MockRequest) => [number, unknown];

interface Entry {
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

export interface RequestLogEntry {
  method: string;
  path: string;
  query: Record<string, string>;
  matched: boolean;
}

/**
 * A Pretender-style route table (get/post/put/delete with `:param` paths) served through
 * Playwright's network layer.
 */
export class RouteTable {
  readonly log: RequestLogEntry[] = [];

  private entries: Entry[] = [];

  constructor(private apiBase: string) {}

  get(endpoint: string, handler: Handler) {
    this.add('GET', endpoint, handler);
  }

  post(endpoint: string, handler: Handler) {
    this.add('POST', endpoint, handler);
  }

  put(endpoint: string, handler: Handler) {
    this.add('PUT', endpoint, handler);
  }

  delete(endpoint: string, handler: Handler) {
    this.add('DELETE', endpoint, handler);
  }

  private add(method: string, endpoint: string, handler: Handler) {
    const keys: string[] = [];
    const pattern = endpoint
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:([A-Za-z_]+)/g, (_m, key) => {
        keys.push(key);
        return '([^/]+)';
      });

    // Later registrations win, matching Pretender's behaviour for overrides.
    this.entries.unshift({
      method,
      regex: new RegExp(`^${pattern}$`),
      keys,
      handler
    });
  }

  async attach(page: Page) {
    await page.route(`${this.apiBase}/**`, route => this.dispatch(route));
  }

  /** Requests whose path matched `pattern`, e.g. to assert no polling. */
  requests(pattern: RegExp) {
    return this.log.filter(entry => pattern.test(entry.path));
  }

  private async dispatch(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(new URL(this.apiBase).pathname.length);
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(request) });
      return;
    }

    for (const entry of this.entries) {
      const match = entry.method === method && entry.regex.exec(path);

      if (match) {
        const params: Record<string, string> = {};

        entry.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });

        const [status, body] = entry.handler({
          params,
          queryParams: Object.fromEntries(url.searchParams),
          requestBody: request.postData(),
          url: request.url()
        });

        this.log.push({ method, path, query: Object.fromEntries(url.searchParams), matched: true });
        await route.fulfill({
          status,
          headers: {
            ...corsHeaders(request),
            'content-type': 'application/json'
          },
          body: body === undefined ? '' : JSON.stringify(body)
        });
        return;
      }
    }

    // Fail loudly: an unmocked call means the fixtures are incomplete.
    this.log.push({ method, path, query: Object.fromEntries(url.searchParams), matched: false });
    await route.fulfill({
      status: 501,
      headers: corsHeaders(request),
      json: { message: `e2e: no mock for ${method} ${path}` }
    });
  }
}

function corsHeaders(request: ReturnType<Route['request']>) {
  return {
    'access-control-allow-origin': request.headers().origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };
}
