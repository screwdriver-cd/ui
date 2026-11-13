import {
  createRoute,
  lazyRouteComponent,
  redirect
} from '@tanstack/react-router';
import { getSession } from '~/auth/session';
import type { CreateRoutes } from '../routes';
import { UserSettingsLayout } from './components/UserSettingsLayout';

export const createRoutes: CreateRoutes = authenticated => {
  const layout = createRoute({
    getParentRoute: () => authenticated,
    path: '/user-settings',
    // Guests have no account to configure.
    beforeLoad: () => {
      if (getSession().data?.isGuest) {
        throw redirect({ to: '/' });
      }
    },
    component: UserSettingsLayout
  });
  const index = createRoute({
    getParentRoute: () => layout,
    path: '/',
    component: () => null
  });
  const preferences = createRoute({
    getParentRoute: () => layout,
    path: '/preferences',
    component: lazyRouteComponent(
      () => import('./components/PreferencesPage'),
      'PreferencesPage'
    )
  });
  const tokens = createRoute({
    getParentRoute: () => layout,
    path: '/access-tokens',
    component: lazyRouteComponent(
      () => import('./components/TokensPage'),
      'TokensPage'
    )
  });

  return [layout.addChildren([index, preferences, tokens])];
};
