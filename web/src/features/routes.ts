import type { AnyRoute } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

export interface RouteContext {
  queryClient: QueryClient;
}

/**
 * Every feature exposes `createRoutes(authenticated)` from
 * src/features/<feature>/routes.tsx and returns its route(s), parented to the
 * authenticated layout route. Features never edit app/router.tsx.
 */
export type CreateRoutes = (authenticated: AnyRoute) => AnyRoute[];
