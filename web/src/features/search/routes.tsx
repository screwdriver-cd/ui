import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

export const createRoutes: CreateRoutes = authenticated => [
  createRoute({
    getParentRoute: () => authenticated,
    path: '/search',
    validateSearch: (search: Record<string, unknown>): { query?: string } => ({
      query:
        typeof search.query === 'string' && search.query
          ? search.query
          : undefined
    }),
    component: lazyRouteComponent(
      () => import('./components/SearchPage'),
      'SearchPage'
    )
  })
];
