import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { vi } from 'vitest';
import { I18nProvider } from '~/i18n/I18nProvider';
import type { AnyLocale } from '~/i18n/locale';

type Handler = (request: {
  url: URL;
  method: string;
  body: unknown;
}) => unknown | [number, unknown];

/**
 * Stubs fetch for the API. Keys are `METHOD /path` (no query). A handler returns the JSON body, or
 * `[status, body]`. Unmatched calls fail the test loudly.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: Array<{
    method: string;
    path: string;
    query: URLSearchParams;
    body: unknown;
  }> = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const path = url.pathname.replace(/^\/v4/, '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    calls.push({ method, path, query: url.searchParams, body });

    const key = Object.keys(routes).find(k => {
      const [m, pattern] = k.split(' ') as [string, string];

      return (
        m === method &&
        new RegExp(`^${pattern.replace(/:[A-Za-z]+/g, '[^/]+')}$`).test(path)
      );
    });

    if (!key) {
      return new Response(
        JSON.stringify({ message: `no mock for ${method} ${path}` }),
        { status: 501 }
      );
    }

    const result = routes[key]!({ url, method, body });
    const [status, payload] =
      Array.isArray(result) && typeof result[0] === 'number'
        ? (result as [number, unknown])
        : [200, result];

    return new Response(payload === undefined ? '' : JSON.stringify(payload), {
      status
    });
  });

  vi.stubGlobal('fetch', fn);

  return { calls, fn };
}

export function renderPage(
  Component: ComponentType,
  {
    path = '/',
    url = path,
    locale = 'en',
    extraPaths = [] as string[]
  }: {
    path?: string;
    url?: string;
    locale?: AnyLocale;
    extraPaths?: string[];
  } = {}
) {
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({
    getParentRoute: () => root,
    path,
    component: Component as never
  });
  const others = extraPaths.map(extra =>
    createRoute({
      getParentRoute: () => root,
      path: extra,
      component: () => <div data-testid={`at${extra}`} />
    })
  );
  const router = createRouter({
    routeTree: root.addChildren([page, ...others]),
    history: createMemoryHistory({ initialEntries: [url] })
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>
          <RouterProvider router={router} />
        </I18nProvider>
      </QueryClientProvider>
    )
  };
}
