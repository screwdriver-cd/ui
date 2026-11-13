import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach } from 'vitest';
import { ApiError } from '~/api/client';
import { patchProperty } from '~/test/patch';
import { mockApi } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import {
  collectionKeys,
  errorMessage,
  LAST_VIEWED_KEY,
  metricsQuery,
  readLastViewed,
  searchPipelines,
  useCanUseCollections,
  useCollection,
  useCollectionMutations,
  useCollections,
  usePipelineMetrics,
  writeLastViewed
} from './api';

afterEach(() => signOut());

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

const collection = { id: 3, name: 'Team', type: 'normal', pipelineIds: [1] };

describe('last viewed collection', () => {
  it('round-trips the id as a string and clears it on null', () => {
    writeLastViewed(7);
    expect(localStorage.getItem(LAST_VIEWED_KEY)).toBe('7');
    expect(readLastViewed()).toBe('7');

    writeLastViewed(null);
    expect(localStorage.getItem(LAST_VIEWED_KEY)).toBeNull();
    expect(readLastViewed()).toBeNull();
  });

  it('treats unavailable storage as nothing stored and never throws', () => {
    const boom = () => {
      throw new Error('SecurityError');
    };

    patchProperty(Storage.prototype, 'getItem', { value: boom });
    patchProperty(Storage.prototype, 'setItem', { value: boom });
    patchProperty(Storage.prototype, 'removeItem', { value: boom });

    expect(readLastViewed()).toBeNull();
    expect(() => writeLastViewed(1)).not.toThrow();
    expect(() => writeLastViewed(null)).not.toThrow();
  });
});

describe('useCanUseCollections', () => {
  it('is false when signed out, false for guests and true for users', () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useCanUseCollections(), {
      wrapper
    });

    expect(result.current).toBe(false);

    act(() => signIn({ scope: ['guest'] }));
    rerender();
    expect(result.current).toBe(false);

    act(() => signIn());
    rerender();
    expect(result.current).toBe(true);
  });
});

describe('collection queries', () => {
  it('lists collections for a signed-in user', async () => {
    signIn();
    const { calls } = mockApi({ 'GET /collections': () => [collection] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCollections(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([collection]));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/collections' });
  });

  it('does not fetch collections for guests', async () => {
    signIn({ scope: ['guest'] });
    const { fn } = mockApi({ 'GET /collections': () => [collection] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCollections(), { wrapper });

    // A disabled query stays pending without fetching.
    await act(async () => {});
    expect(result.current.fetchStatus).toBe('idle');
    expect(fn).not.toHaveBeenCalled();
  });

  it('fetches one collection by id under its own key', async () => {
    signIn();
    const { calls } = mockApi({ 'GET /collections/:id': () => collection });
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useCollection('3'), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(collection));
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/collections/3' });
    expect(queryClient.getQueryData(collectionKeys.one(3))).toEqual(collection);
  });

  it('fetches the last 20 events of a pipeline as metrics, unless disabled', async () => {
    signIn();
    const metric = {
      createTime: '2020-01-01T00:00:00.000Z',
      status: 'SUCCESS'
    };
    const { calls } = mockApi({ 'GET /pipelines/:id/metrics': () => [metric] });
    const { wrapper } = setup();
    const { result } = renderHook(() => usePipelineMetrics(7), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([metric]));
    expect(calls[0]?.path).toBe('/pipelines/7/metrics');
    expect(Object.fromEntries(calls[0]!.query)).toEqual({
      count: '20',
      page: '1'
    });
    expect(metricsQuery(7)).toMatchObject({
      queryKey: ['pipeline-metrics', '7'],
      staleTime: 30_000
    });

    const disabled = renderHook(() => usePipelineMetrics(8, false), {
      wrapper
    });

    await act(async () => {});
    expect(disabled.result.current.fetchStatus).toBe('idle');
    expect(calls.map(c => c.path)).not.toContain('/pipelines/8/metrics');
  });
});

describe('useCollectionMutations', () => {
  const run = () => {
    signIn();
    const { calls } = mockApi({
      'POST /collections': ({ body }) => ({ id: 9, ...(body as object) }),
      'PUT /collections/:id': ({ body }) => ({ id: 3, ...(body as object) }),
      'DELETE /collections/:id': () => undefined,
      'PUT /collections/:id/pipelines': () => undefined,
      'DELETE /collections/:id/pipelines': () => undefined
    });
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCollectionMutations(), { wrapper });
    const invalidatedKeys = () =>
      invalidate.mock.calls.map(([filters]) => filters?.queryKey);

    return { calls, result, invalidatedKeys };
  };

  it('creates a normal collection and refreshes the list', async () => {
    const { calls, result, invalidatedKeys } = run();

    await act(() =>
      result.current.create.mutateAsync({ name: 'New', description: 'd' })
    );

    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/collections',
      body: { type: 'normal', name: 'New', description: 'd' }
    });
    expect(invalidatedKeys()).toEqual([['collections']]);
  });

  it('updates without sending the id in the body and refreshes the list and the collection', async () => {
    const { calls, result, invalidatedKeys } = run();

    await act(() =>
      result.current.update.mutateAsync({ id: 3, name: 'Renamed' })
    );

    expect(calls[0]).toMatchObject({
      method: 'PUT',
      path: '/collections/3',
      body: { name: 'Renamed' }
    });
    expect(invalidatedKeys()).toEqual([['collections'], ['collection', '3']]);
  });

  it('deletes a collection and refreshes the list', async () => {
    const { calls, result, invalidatedKeys } = run();

    await act(() => result.current.remove.mutateAsync(3));

    expect(calls[0]).toMatchObject({
      method: 'DELETE',
      path: '/collections/3',
      body: undefined
    });
    expect(invalidatedKeys()).toEqual([['collections']]);
  });

  it('adds and removes pipelines with ids[] query params and no body', async () => {
    const { calls, result, invalidatedKeys } = run();

    await act(() =>
      result.current.addPipelines.mutateAsync({ id: 3, pipelineIds: [1, 2] })
    );
    await act(() =>
      result.current.removePipelines.mutateAsync({ id: 3, pipelineIds: [5] })
    );

    expect(
      calls.map(c => [c.method, c.path, c.query.getAll('ids[]'), c.body])
    ).toEqual([
      ['PUT', '/collections/3/pipelines', ['1', '2'], undefined],
      ['DELETE', '/collections/3/pipelines', ['5'], undefined]
    ]);
    expect(invalidatedKeys()).toEqual([
      ['collections'],
      ['collection', '3'],
      ['collections'],
      ['collection', '3']
    ]);
  });

  it('does not refresh when the request fails', async () => {
    signIn();
    mockApi({
      'POST /collections': () => [409, { message: 'Collection already exists' }]
    });
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCollectionMutations(), { wrapper });

    await act(async () => {
      await expect(
        result.current.create.mutateAsync({ name: 'Dup' })
      ).rejects.toMatchObject({
        status: 409,
        message: 'Collection already exists'
      });
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('searchPipelines', () => {
  it('asks for 50 pipelines sorted by name and adds search only when given', async () => {
    const { calls } = mockApi({ 'GET /pipelines': () => [] });

    await searchPipelines('foo', 3);
    await searchPipelines('');

    expect(calls.map(c => [c.path, Object.fromEntries(c.query)])).toEqual([
      [
        '/pipelines',
        {
          page: '3',
          count: '50',
          sortBy: 'name',
          sort: 'ascending',
          search: 'foo'
        }
      ],
      [
        '/pipelines',
        { page: '1', count: '50', sortBy: 'name', sort: 'ascending' }
      ]
    ]);
  });
});

describe('errorMessage', () => {
  it('shows the API message but falls back for generic, empty and non-Error failures', () => {
    expect(errorMessage(new ApiError(409, {}, 'Name taken'), 'fallback')).toBe(
      'Name taken'
    );
    expect(errorMessage(new ApiError(500, undefined), 'fallback')).toBe(
      'fallback'
    );
    expect(errorMessage(new Error(''), 'fallback')).toBe('fallback');
    expect(errorMessage('nope', 'fallback')).toBe('fallback');
  });
});
