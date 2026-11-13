import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

/** Mounted outside the auth layout (see app/router.tsx): the validator is usable signed out. */
export const createRoutes: CreateRoutes = parent => [
  createRoute({
    getParentRoute: () => parent,
    path: '/validator',
    component: lazyRouteComponent(
      () => import('./components/ValidatorPage'),
      'ValidatorPage'
    )
  })
];
