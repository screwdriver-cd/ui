import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  redirect,
  type AnyRoute
} from '@tanstack/react-router';
import { getSession } from '~/auth/session';
import { config } from '~/config/config';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import type { CreateRoutes, RouteContext } from '~/features/routes';
import { createRoutes as build } from '~/features/build/routes';
import { createRoutes as collections } from '~/features/collections/routes';
import { createRoutes as commands } from '~/features/commands/routes';
import { createRoutes as create } from '~/features/create/routes';
import { createRoutes as pipeline } from '~/features/pipeline/routes';
import { createRoutes as search } from '~/features/search/routes';
import { createRoutes as templates } from '~/features/templates/routes';
import { createRoutes as userSettings } from '~/features/user-settings/routes';
import { createRoutes as validator } from '~/features/validator/routes';
import { createRoutes as visualizer } from '~/features/visualizer/routes';
import { AppShell } from './AppShell';
import { rememberAttemptedUrl } from './attempted-url';
import { LoginPage } from './LoginPage';

function NotFound() {
  const t = useT();

  return (
    <PageLayout>
      <div className="container py-4" id="not-found">
        <h2>{t('error.notFound.title')}</h2>
        <p>{t('error.notFound.body')}</p>
        <Link to="/">{t('nav.home')}</Link>
      </div>
    </PageLayout>
  );
}

const rootRoute = createRootRouteWithContext<RouteContext>()({
  component: AppShell,
  notFoundComponent: NotFound
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    // Guests hold a session but can still sign in to a real account.
    const { isAuthenticated, data } = getSession();

    if (isAuthenticated && !data?.isGuest) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage
});

// Pathless layout: everything below requires a session, like Ember's
// AuthenticatedRouteMixin.
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ location }) => {
    if (!getSession().isAuthenticated) {
      rememberAttemptedUrl(location.href);
      throw redirect({ to: '/login' });
    }
  }
});

const featureRoutes: CreateRoutes[] = [
  collections,
  pipeline,
  build,
  templates,
  commands,
  search,
  create,
  userSettings,
  visualizer
];

const children: AnyRoute[] = featureRoutes.flatMap(createRoutes => createRoutes(authenticatedRoute));

// Public like Ember's plain `validator` route; the API's POST /validator needs no auth either.
const publicChildren: AnyRoute[] = validator(rootRoute);

const routeTree = rootRoute.addChildren([loginRoute, ...publicChildren, authenticatedRoute.addChildren(children)]);

// Search params stay plain strings (`?query=123`, `?selectedPipelineId=101`),
// so URLs match the Ember app's and links keep working.
const parseSearch = (search: string): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(search));
const stringifySearch = (params: Record<string, unknown>): string => {
  const out = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      out.set(k, String(v));
    }
  });
  const text = out.toString();

  return text ? `?${text}` : '';
};

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    basepath: config.rootURL === '/' ? undefined : config.rootURL,
    parseSearch,
    stringifySearch,
    defaultPreload: false
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
