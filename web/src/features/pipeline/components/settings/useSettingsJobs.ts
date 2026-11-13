import { useMemo } from 'react';
import { useJobs } from '../../api/queries';
import type { Job } from '../../types';
import { getDisplayName, getStageName, isVirtualJob } from '../../utils/job';

export interface JobRow {
  id: number;
  name: string;
  stage: string;
  job: Job;
}

/** The pipeline's own jobs (no PR copies, no virtual jobs) by name, as the Ember settings tables list them. */
export function useSettingsJobs(pipelineId: number) {
  const query = useJobs(pipelineId, 'pipeline');
  const rows = useMemo<JobRow[]>(
    () =>
      (query.data ?? [])
        .filter(j => !j.prParentJobId && !isVirtualJob(j))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(job => ({
          id: job.id,
          name: getDisplayName(job),
          stage: getStageName(job) ?? '',
          job
        })),
    [query.data]
  );

  return { rows, query };
}

export const distinct = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
