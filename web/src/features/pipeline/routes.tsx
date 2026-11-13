import { createRoute, redirect, type AnyRoute } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';
import type { SettingsSection } from './pages/SettingsPage';
import './styles.scss';

import { lazyNamed } from '../lazy';

const PipelineLayout = lazyNamed(
  () => import('./components/PipelineLayout'),
  'PipelineLayout'
);
const ChildPipelinesPage = lazyNamed(
  () => import('./pages/ChildPipelinesPage'),
  'ChildPipelinesPage'
);
const EventsPage = lazyNamed(() => import('./pages/EventsPage'), 'EventsPage');
const JobsPage = lazyNamed(() => import('./pages/JobsPage'), 'JobsPage');
const MetricsPage = lazyNamed(
  () => import('./pages/MetricsPage'),
  'MetricsPage'
);
const SecretsPage = lazyNamed(
  () => import('./pages/SecretsPage'),
  'SecretsPage'
);
const SettingsPage = lazyNamed(
  () => import('./pages/SettingsPage'),
  'SettingsPage'
);
const TokensPage = lazyNamed(() => import('./pages/TokensPage'), 'TokensPage');

const BASE = '/v2/pipelines/$pipelineId';

/**
 * /v2/pipelines/:id and its tabs. The layout route loads the pipeline once;
 * every tab is a child so switching tabs never refetches it.
 */
export const createRoutes: CreateRoutes = authenticated => {
  const layout = createRoute({
    getParentRoute: () => authenticated,
    path: BASE,
    component: PipelineLayout
  });
  const child = (path: string, component: () => React.JSX.Element): AnyRoute =>
    createRoute({ getParentRoute: () => layout, path, component });
  const settings = (path: string, section: SettingsSection): AnyRoute =>
    child(path, () => <SettingsPage section={section} />);
  const redirectTo = (path: string, to: string): AnyRoute =>
    createRoute({
      getParentRoute: () => layout,
      path,
      beforeLoad: ({ params }) => {
        throw redirect({
          to: `/v2/pipelines/${
            (params as { pipelineId: string }).pipelineId
          }/${to}` as never,
          replace: true
        });
      }
    });

  // v1 URLs (and `/v2`) keep working: same table as Ember's opt-in route mapping.
  const legacy = (
    path: string,
    to: (p: { pipelineId: string; eventId?: string }) => string
  ): AnyRoute =>
    createRoute({
      getParentRoute: () => authenticated,
      path,
      beforeLoad: ({ params, search }) => {
        throw redirect({
          to: to(params as { pipelineId: string; eventId?: string }) as never,
          search: search as never,
          replace: true
        });
      }
    });
  const v2 = (p: { pipelineId: string }, tab: string) =>
    `/v2/pipelines/${p.pipelineId}/${tab}`;

  return [
    legacy('/v2', () => '/'),
    legacy('/pipelines/$pipelineId', p => v2(p, 'events')),
    legacy('/pipelines/$pipelineId/events', p => v2(p, 'events')),
    legacy('/pipelines/$pipelineId/events/$eventId', p =>
      v2(p, `events/${p.eventId}`)
    ),
    legacy('/pipelines/$pipelineId/jobs', p => v2(p, 'jobs')),
    legacy('/pipelines/$pipelineId/secrets', p => v2(p, 'secrets')),
    legacy('/pipelines/$pipelineId/options', p => v2(p, 'settings')),
    legacy('/pipelines/$pipelineId/child-pipelines', p =>
      v2(p, 'child-pipelines')
    ),
    legacy('/pipelines/$pipelineId/pulls', p => v2(p, 'pulls')),
    legacy('/pipelines/$pipelineId/metrics', p => v2(p, 'metrics')),
    layout.addChildren([
      redirectTo('/', 'events'),
      child('events', () => <EventsPage mode="events" />),
      child('events/$eventId', () => <EventsPage mode="events" />),
      child('pulls', () => <EventsPage mode="pulls" />),
      child('pulls/$eventId', () => <EventsPage mode="pulls" />),
      child('jobs', JobsPage),
      child('secrets', SecretsPage),
      child('secrets/tokens', TokensPage),
      child('tokens', TokensPage),
      redirectTo('options', 'settings'),
      settings('settings', 'main'),
      settings('settings/jobs', 'jobs'),
      settings('settings/cache', 'cache'),
      settings('settings/metrics', 'metrics'),
      settings('settings/preferences', 'preferences'),
      child('metrics', MetricsPage),
      child('child-pipelines', ChildPipelinesPage)
    ])
  ];
};
