import { createRoute, Outlet, redirect } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

import { lazyNamed } from '../lazy';

const BuildPage = lazyNamed(() => import('./BuildPage'), 'BuildPage');
const BuildRedirect = lazyNamed(() => import('./BuildRedirect'), 'BuildRedirect');
const JobLatestBuildRedirect = lazyNamed(() => import('./JobLatestBuildRedirect'), 'JobLatestBuildRedirect');

/**
 * Same URLs as the Ember app:
 *   /builds/:build_id
 *   /pipelines/:pipeline_id/builds/:build_id
 *   .../steps/:step_id
 *   /pipelines/:pipeline_id/jobs/:job_name[/steps/:step|/artifacts[/*file]] (latest build of a job)
 *   .../artifacts and .../artifacts/*file_path
 * The build route is a layout so switching step or tab keeps the page (and
 * its polling and log state) mounted.
 */
export const createRoutes: CreateRoutes = authenticated => {
  const buildRedirect = createRoute({
    getParentRoute: () => authenticated,
    path: '/builds/$buildId',
    component: BuildRedirect
  });

  const build = createRoute({
    getParentRoute: () => authenticated,
    path: '/pipelines/$pipelineId/builds/$buildId',
    component: BuildPage
  });

  // Children render nothing: the layout reads the params and draws everything.
  const leaf = (path: string) =>
    createRoute({ getParentRoute: () => build, path, component: () => <Outlet /> });

  const latest = (path: string, artifacts = false) =>
    createRoute({
      getParentRoute: () => authenticated,
      path: `/pipelines/$pipelineId/jobs/$jobName${path}`,
      component: () => <JobLatestBuildRedirect artifacts={artifacts} />
    });

  // The v2 Ember URL for a build; the page itself lives at the classic URL.
  const v2Build = createRoute({
    getParentRoute: () => authenticated,
    path: '/v2/pipelines/$pipelineId/builds/$buildId',
    beforeLoad: ({ params }) => {
      throw redirect({ to: `/pipelines/${params.pipelineId}/builds/${params.buildId}` as never, replace: true });
    }
  });

  return [
    v2Build,
    buildRedirect,
    latest(''),
    latest('/steps/$stepName'),
    latest('/artifacts', true),
    latest('/artifacts/$', true),
    build.addChildren([leaf('/'), leaf('/steps/$stepId'), leaf('/artifacts'), leaf('/artifacts/$')])
  ];
};
