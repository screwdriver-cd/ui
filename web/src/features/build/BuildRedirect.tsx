import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from '@tanstack/react-router';
import { api } from '~/api/client';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import type { Build, Job } from './types';

/** `/builds/:build_id` -> `/pipelines/:pipeline_id/builds/:build_id` (needs the job's pipeline). */
export function BuildRedirect() {
  const t = useT();
  const { buildId } = useParams({ strict: false }) as { buildId: string };
  const target = useQuery({
    queryKey: ['build-pipeline', buildId],
    queryFn: async () => {
      const build = await api.get<Build>(`/builds/${buildId}`);
      const job = await api.get<Job>(`/jobs/${build.jobId}`);

      return { pipelineId: job.pipelineId, buildId: build.id };
    }
  });

  if (target.data) {
    return <Navigate to={`/pipelines/${target.data.pipelineId}/builds/${target.data.buildId}`} replace />;
  }

  return (
    <PageLayout>
      <div className="container py-4">
        {target.isError ? (
          <>
            <h2>{t('build.notFound.title')}</h2>
            <p>{t('build.notFound.body')}</p>
            <Link to="/">{t('nav.home')}</Link>
          </>
        ) : (
          t('common.loading')
        )}
      </div>
    </PageLayout>
  );
}
