import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/client';
import { useSession } from '~/auth/session';
import type { Collection, EventMetric, PipelineSummary } from './types';

export const NUM_PIPELINES_LISTED = 50;
export const LAST_VIEWED_KEY = 'lastViewedCollectionId';

export const collectionKeys = {
  all: ['collections'] as const,
  one: (id: number | string) => ['collection', String(id)] as const,
  metrics: (pipelineId: number | string) => ['pipeline-metrics', String(pipelineId)] as const
};

export function readLastViewed(): string | null {
  try {
    return localStorage.getItem(LAST_VIEWED_KEY);
  } catch {
    return null;
  }
}

export function writeLastViewed(id: string | number | null) {
  try {
    if (id === null) {
      localStorage.removeItem(LAST_VIEWED_KEY);
    } else {
      localStorage.setItem(LAST_VIEWED_KEY, String(id));
    }
  } catch {
    // not persisted
  }
}

/** Guests have no collections, so nothing is fetched for them. */
export function useCanUseCollections() {
  return useSession(s => s.isAuthenticated && !s.data?.isGuest);
}

export function useCollections() {
  const enabled = useCanUseCollections();

  return useQuery({
    queryKey: collectionKeys.all,
    queryFn: () => api.get<Collection[]>('/collections'),
    enabled
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: collectionKeys.one(id),
    queryFn: () => api.get<Collection>(`/collections/${id}`),
    // Always reload when the page opens (Ember did `reload: true`).
    staleTime: 0
  });
}

export const metricsQuery = (pipelineId: number) => ({
  queryKey: collectionKeys.metrics(pipelineId),
  queryFn: () => api.get<EventMetric[]>(`/pipelines/${pipelineId}/metrics`, { query: { count: 20, page: 1 } }),
  staleTime: 30_000
});

export function usePipelineMetrics(pipelineId: number, enabled = true) {
  return useQuery({ ...metricsQuery(pipelineId), enabled });
}

export function useCollectionMutations() {
  const queryClient = useQueryClient();
  const refresh = (id?: number | string) => {
    queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    if (id !== undefined) {
      queryClient.invalidateQueries({ queryKey: collectionKeys.one(id) });
    }
  };

  return {
    create: useMutation({
      mutationFn: (input: { name: string; description?: string }) =>
        api.post<Collection>('/collections', { type: 'normal', ...input }),
      onSuccess: () => refresh()
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: number; name: string; description?: string }) =>
        api.put<Collection>(`/collections/${id}`, input),
      onSuccess: (_data, { id }) => refresh(id)
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/collections/${id}`),
      onSuccess: () => refresh()
    }),
    addPipelines: useMutation({
      mutationFn: ({ id, pipelineIds }: { id: number; pipelineIds: number[] }) =>
        api.put(`/collections/${id}/pipelines`, undefined, { query: { ids: pipelineIds } }),
      onSuccess: (_data, { id }) => refresh(id)
    }),
    removePipelines: useMutation({
      mutationFn: ({ id, pipelineIds }: { id: number; pipelineIds: number[] }) =>
        api.delete(`/collections/${id}/pipelines`, { query: { ids: pipelineIds } }),
      onSuccess: (_data, { id }) => refresh(id)
    })
  };
}

export function searchPipelines(search: string, page = 1) {
  return api.get<PipelineSummary[]>('/pipelines', {
    query: {
      page,
      count: NUM_PIPELINES_LISTED,
      sortBy: 'name',
      sort: 'ascending',
      ...(search ? { search } : {})
    }
  });
}

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message && !error.message.startsWith('Request failed') ? error.message : fallback;
