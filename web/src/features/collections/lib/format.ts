import type { PipelineSummary } from './types';

export const branchLabel = (pipeline: PipelineSummary) => {
  const { branch, rootDir } = pipeline.scmRepo;

  return rootDir ? `${branch}#${rootDir}` : branch;
};

export const formatDate = (iso: string | null, locale: string) =>
  iso ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)) : null;
