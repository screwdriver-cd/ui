import {
  createRoute,
  lazyRouteComponent,
  redirect
} from '@tanstack/react-router';
import { getSession } from '~/auth/session';
import type { CreateRoutes } from '../routes';

export const createRoutes: CreateRoutes = authenticated => [
  createRoute({
    getParentRoute: () => authenticated,
    path: '/create',
    // Guests cannot create pipelines (the header hides the link; this covers typed URLs).
    beforeLoad: () => {
      if (getSession().data?.isGuest) {
        throw redirect({ to: '/' });
      }
    },
    // Loads the YAML editor (CodeMirror) only when the page is opened.
    component: lazyRouteComponent(
      () => import('./components/CreatePage'),
      'CreatePage'
    )
  })
];
