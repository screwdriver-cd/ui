import type { Job } from '../types';

export const getPrNumber = (job: Pick<Job, 'name'>) =>
  parseInt(job.name.slice('PR-'.length), 10);

export const getPrNumbers = (jobs: Array<Pick<Job, 'name'>>): number[] =>
  [...new Set(jobs.map(getPrNumber).filter(n => !Number.isNaN(n)))].sort(
    (a, b) => a - b
  );
