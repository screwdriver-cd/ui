import { createRoute, redirect } from '@tanstack/react-router';
import { getSession } from '~/auth/session';
import type { CreateRoutes } from '../routes';
import {
  DashboardIndexPage,
  DashboardShowPage,
  HomePage
} from './components/pages';

// Guests have no collections: send them back to the home page, like Ember's
// dashboard route did.
const guestsGoHome = () => {
  if (getSession().data?.isGuest) {
    throw redirect({ to: '/' });
  }
};

export const createRoutes: CreateRoutes = authenticated => [
  createRoute({
    getParentRoute: () => authenticated,
    path: '/',
    component: HomePage
  }),
  createRoute({
    getParentRoute: () => authenticated,
    path: '/dashboards',
    beforeLoad: guestsGoHome,
    component: DashboardIndexPage
  }),
  createRoute({
    getParentRoute: () => authenticated,
    path: '/dashboards/$collectionId',
    beforeLoad: guestsGoHome,
    component: DashboardShowPage
  })
];
