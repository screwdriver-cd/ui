import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '~/api/client';
import type { SdEvent } from '../types';

export const SEARCH_FIELDS = ['message', 'sha', 'creator', 'author'] as const;
export type SearchField = (typeof SEARCH_FIELDS)[number];
export const SEARCH_PAGE_SIZE = 10;
export const SEARCH_MAX_LENGTH = 50;

/** Hex only, like Ember: a partial sha is a prefix match on the API. */
export const isValidSha = (value: string) => /^[0-9a-f]{1,40}$/.test(value);

export function isSearchable(field: SearchField, input: string): boolean {
  const value = input.trim();

  return value.length > 0 && (field !== 'sha' || isValidSha(value));
}

/**
 * Finds events by commit message, sha, creator or commit author. The API
 * pages with `page`/`count` here (not the id cursors the rail uses), a short
 * page ends the list.
 */
export function useEventSearch(opts: {
  pipelineId: number;
  isPr: boolean;
  field: SearchField;
  input: string;
}) {
  const { pipelineId, isPr, field } = opts;
  const input = opts.input.trim();

  return useInfiniteQuery({
    queryKey: ['eventSearch', pipelineId, isPr, field, input],
    enabled: isSearchable(field, input),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<SdEvent[]>(`/pipelines/${pipelineId}/events`, {
        query: {
          [field]: input,
          type: isPr ? 'pr' : 'pipeline',
          page: pageParam,
          count: SEARCH_PAGE_SIZE
        },
        signal
      }),
    getNextPageParam: (last, pages) =>
      last.length < SEARCH_PAGE_SIZE ? undefined : pages.length + 1,
    staleTime: 30_000
  });
}
