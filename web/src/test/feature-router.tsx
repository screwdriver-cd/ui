import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { act } from '@testing-library/react';
import type { CreateRoutes } from '~/features/routes';
import { renderWithProviders } from './render';

export { signIn, signOut } from './session';

/** Render one feature's routes in a memory router at `url`, under a pathless layout like the app's. */
export async function renderFeature(createRoutes: CreateRoutes, url: string, options: { locale?: 'en' | 'ja' } = {}) {
  const root = createRootRoute();
  const authenticated = createRoute({ getParentRoute: () => root, id: 'authenticated' });
  const routeTree = root.addChildren([authenticated.addChildren(createRoutes(authenticated))]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [url] }) });
  const utils = renderWithProviders(<RouterProvider router={router} />, options);

  await act(async () => {
    await router.load();
  });

  return { router, ...utils };
}

type Handler = (url: URL, init?: RequestInit) => unknown | Response | undefined;

/**
 * Stub `fetch` with `[pattern, handler]` pairs matched against `pathname` (first match wins).
 * Handlers return JSON-able data, a Response, or a number for an empty response with that status.
 * Unmatched requests answer 404 and are listed in `calls` with `matched: false`.
 */
export function mockFetch(routes: Array<[RegExp | string, Handler]>) {
  const calls: Array<{ method: string; path: string; search: string; matched: boolean }> = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const hit = routes.find(([p]) => (typeof p === 'string' ? url.pathname === p : p.test(url.pathname)));

    calls.push({ method: init?.method ?? 'GET', path: url.pathname, search: url.search, matched: !!hit });
    if (!hit) {
      return new Response('{}', { status: 404 });
    }
    const out = hit[1](url, init);

    if (out instanceof Response) {
      return out;
    }
    if (typeof out === 'number') {
      return new Response('', { status: out });
    }

    return new Response(typeof out === 'string' ? out : JSON.stringify(out ?? {}), { status: 200 });
  });

  vi.stubGlobal('fetch', fn);

  return { fn, calls };
}
