import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams, useSearch } from '@tanstack/react-router';
import { api } from '~/api/client';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { encodeArtifactPath } from './api';
import type { Build } from './types';

/** Where inside the build to land; mirrors the Ember job-latest-build child routes. */
export function latestBuildTarget(
  pipelineId: string,
  buildId: number,
  params: { stepName?: string; _splat?: string },
  artifacts: boolean
): string {
  const base = `/pipelines/${pipelineId}/builds/${buildId}`;

  if (params.stepName) {
    return `${base}/steps/${encodeURIComponent(params.stepName)}`;
  }
  if (artifacts) {
    return params._splat ? `${base}/artifacts/${encodeArtifactPath(params._splat)}` : `${base}/artifacts`;
  }

  return base;
}

/**
 * `/pipelines/:id/jobs/:name` (+ `/steps/:step`, `/artifacts[/*file]`, `?status=`):
 * resolves the job's latest build and replaces the URL with the real build URL.
 */
export function JobLatestBuildRedirect({ artifacts = false }: { artifacts?: boolean }) {
  const t = useT();
  const params = useParams({ strict: false }) as {
    pipelineId: string;
    jobName: string;
    stepName?: string;
    _splat?: string;
  };
  const { status } = useSearch({ strict: false }) as { status?: string };
  const latest = useQuery({
    queryKey: ['job-latest-build', params.pipelineId, params.jobName, status ?? ''],
    queryFn: ({ signal }) =>
      api.get<Build>(`/pipelines/${params.pipelineId}/jobs/${encodeURIComponent(params.jobName)}/latestBuild`, {
        query: { status: status ? String(status).toUpperCase() : undefined },
        signal
      }),
    retry: false,
    gcTime: 0
  });

  if (latest.data) {
    return <Navigate to={latestBuildTarget(params.pipelineId, latest.data.id, params, artifacts)} replace />;
  }

  return (
    <PageLayout>
      <div className="container py-4" id="latest-build-status">
        {latest.isError ? (
          <>
            <h2>{t('build.latest.notFound', { job: params.jobName })}</h2>
            <Link to={`/v2/pipelines/${params.pipelineId}/events`}>{t('build.latest.toPipeline')}</Link>
          </>
        ) : (
          t('common.loading')
        )}
      </div>
    </PageLayout>
  );
}
