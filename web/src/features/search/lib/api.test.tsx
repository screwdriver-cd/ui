import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { mockApi } from '~/test/page';
import { branchUrlEncode, useScmContexts } from './api';

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useScmContexts', () => {
  it('loads /auth/contexts once and treats it as never stale', async () => {
    const contexts = [
      { context: 'github:github.com', displayName: 'github.com' }
    ];
    const { calls } = mockApi({ 'GET /auth/contexts': () => contexts });
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useScmContexts(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(contexts));
    expect(calls).toEqual([
      expect.objectContaining({ method: 'GET', path: '/auth/contexts' })
    ]);
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['scm-contexts'] })
        ?.isStale()
    ).toBe(false);

    // A second consumer reuses the cached list without another request.
    const second = renderHook(() => useScmContexts(), { wrapper });

    expect(second.result.current.data).toEqual(contexts);
    expect(calls).toHaveLength(1);
  });

  it('does not keep a failed read as an empty list: the next mount asks again', async () => {
    let fail = true;
    const contexts = [
      { context: 'github:github.com', displayName: 'github.com' }
    ];

    mockApi({
      'GET /auth/contexts': () => (fail ? [500, { message: 'down' }] : contexts)
    });
    const { wrapper } = setup();
    const first = renderHook(() => useScmContexts(), { wrapper });

    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(first.result.current.data).toBeUndefined();
    first.unmount();

    fail = false;
    const second = renderHook(() => useScmContexts(), { wrapper });

    await waitFor(() => expect(second.result.current.data).toEqual(contexts));
  });
});

describe('branchUrlEncode', () => {
  it('encodes every # and passes empty values through', () => {
    expect(branchUrlEncode('https://github.com/a/b/tree/fix#1#2')).toBe(
      'https://github.com/a/b/tree/fix%231%232'
    );
    expect(branchUrlEncode('https://github.com/a/b')).toBe(
      'https://github.com/a/b'
    );
    expect(branchUrlEncode('')).toBe('');
    expect(branchUrlEncode(undefined)).toBeUndefined();
  });
});
