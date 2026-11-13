import { createRoute } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

import { lazyNamed } from '../lazy';

const TemplateDetailPage = lazyNamed(
  () => import('./TemplateDetailPage'),
  'TemplateDetailPage'
);
const JobTemplateListPage = lazyNamed(
  () => import('./TemplateListPages'),
  'JobTemplateListPage'
);
const LegacyTemplateRedirect = lazyNamed(
  () => import('./TemplateListPages'),
  'LegacyTemplateRedirect'
);
const PipelineTemplateListPage = lazyNamed(
  () => import('./TemplateListPages'),
  'PipelineTemplateListPage'
);
const TemplatesIndexRedirect = lazyNamed(
  () => import('./TemplateListPages'),
  'TemplatesIndexRedirect'
);
const TemplatesLayout = lazyNamed(
  () => import('./TemplatesLayout'),
  'TemplatesLayout'
);
const TemplateUsagePage = lazyNamed(
  () => import('./TemplateUsagePage'),
  'TemplateUsagePage'
);

/**
 * Same URLs as Ember:
 *   /templates                                  -> /templates/pipeline
 *   /templates/{pipeline,job}[/:namespace[/:name[/:version]]]
 *   /templates/job/:namespace/:name/:version/usage
 *   /templates/*path                            -> /templates/job/*path (legacy)
 */
export const createRoutes: CreateRoutes = authenticated => {
  const layout = createRoute({
    getParentRoute: () => authenticated,
    path: '/templates',
    component: TemplatesLayout
  });
  const child = (path: string, component: () => React.ReactNode) =>
    createRoute({ getParentRoute: () => layout, path, component });
  const detail = (kind: 'job' | 'pipeline') => () =>
    <TemplateDetailPage kind={kind} />;

  return [
    layout.addChildren([
      child('/', TemplatesIndexRedirect),
      child('/pipeline', PipelineTemplateListPage),
      child('/pipeline/$namespace', PipelineTemplateListPage),
      child('/pipeline/$namespace/$name', detail('pipeline')),
      child('/pipeline/$namespace/$name/$version', detail('pipeline')),
      child('/job', JobTemplateListPage),
      child('/job/$namespace', JobTemplateListPage),
      child('/job/$namespace/$name', detail('job')),
      child('/job/$namespace/$name/$version', detail('job')),
      child('/job/$namespace/$name/$version/usage', TemplateUsagePage),
      child('/$', LegacyTemplateRedirect)
    ])
  ];
};
