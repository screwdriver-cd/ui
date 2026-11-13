import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { config } from '~/config/config';
import { mockApi } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { artifactsUrl, buildKey, encodeArtifactPath, useBuild, useCoverageInfo, useStepLogs, useStopBuild } from './api';
import type { Build } from './types';

describe('artifact URLs', () => {
  it('encodes each path segment but keeps the slashes', () => {
    expect(encodeArtifactPath('reports/a#1 ?.html')).toBe('reports/a%231%20%3F.html');
  });

  it('builds URLs that cannot be cut short by # or ?', () => {
    const url = artifactsUrl(5, 'dir/file#2?.txt');

    expect(url.endsWith('/builds/5/artifacts/dir/file%232%3F.txt')).toBe(true);
    expect(new URL(url).hash).toBe('');
  });

  it('leaves an empty path alone', () => {
    expect(artifactsUrl(5).endsWith('/builds/5/artifacts/')).toBe(true);
  });
});

describe('useBuild polling', () => {
  const original = config.buildReloadTimer;

  beforeEach(() => {
    config.buildReloadTimer = 10;
    signIn();
  });
  afterEach(() => {
    config.buildReloadTimer = original;
    signOut();
    vi.unstubAllGlobals();
  });

  const watch = (statuses: Array<Partial<Build>>) => {
    const responses = [...statuses];
    const { calls } = mockApi({
      'GET /builds/:id': () => ({ id: 1, ...(responses.length > 1 ? responses.shift() : responses[0]) })
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useBuild('1'), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });

    return { calls, result };
  };

  it('keeps polling a BLOCKED build until it finishes', async () => {
    const { calls, result } = watch([{ status: 'BLOCKED' }, { status: 'RUNNING' }, { status: 'SUCCESS', endTime: 'x' }]);

    await waitFor(() => expect(result.current.data?.status).toBe('SUCCESS'));
    // A finished build is not fetched again.
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(calls).toHaveLength(3);
  });

  it('keeps polling an UNSTABLE build until it has an end time', async () => {
    const { calls, result } = watch([{ status: 'UNSTABLE' }, { status: 'UNSTABLE', endTime: 'x' }]);

    await waitFor(() => expect(result.current.data?.endTime).toBe('x'));
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(calls).toHaveLength(2);
  });
});

describe('useStopBuild', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('applies a late stop response to the stopped build, not the one now shown', async () => {
    let respond: () => void = () => undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(resolve => {
            respond = () => resolve(new Response(JSON.stringify({ id: 1, status: 'ABORTED' })));
          })
      )
    );
    const queryClient = new QueryClient();

    queryClient.setQueryData(buildKey('1'), { id: 1, status: 'RUNNING' });
    queryClient.setQueryData(buildKey('2'), { id: 2, status: 'RUNNING' });
    const { result, rerender } = renderHook(({ id }) => useStopBuild(id), {
      initialProps: { id: '1' },
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });

    act(() => result.current.mutate());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    rerender({ id: '2' });
    await act(async () => respond());

    await waitFor(() => expect(queryClient.getQueryData(buildKey('1'))).toMatchObject({ status: 'ABORTED' }));
    expect(queryClient.getQueryData(buildKey('2'))).toEqual({ id: 2, status: 'RUNNING' });
  });
});

describe('useStepLogs', () => {
  const original = config.logReloadTimer;

  beforeEach(() => {
    config.logReloadTimer = 10;
    signIn();
  });
  afterEach(() => {
    config.logReloadTimer = original;
    signOut();
    vi.unstubAllGlobals();
  });

  // Serves `total` lines per step; `pages` pages of 100 lines from `from`.
  const serveLogs = (totals: Record<string, number>, fail = (_step: string) => false) =>
    mockApi({
      'GET /builds/:id/steps/:step/logs': ({ url }) => {
        const step = url.pathname.split('/').at(-2)!;

        if (fail(step)) {
          return [502, { message: 'Bad Gateway' }];
        }
        const from = Number(url.searchParams.get('from'));
        const to = Math.min(totals[step] ?? 0, from + Number(url.searchParams.get('pages')) * 100);

        return Array.from({ length: Math.max(0, to - from) }, (_, i) => ({ n: from + i, m: `${step} ${from + i}`, t: 0 }));
      }
    });

  const setup = (stepName: string, totalLines: number) =>
    renderHook(props => useStepLogs({ buildId: '1', started: true, enabled: true, ...props }), {
      initialProps: { stepName, totalLines }
    });

  it('retries a failed read instead of treating it as the end of the log', async () => {
    let failures = 1;

    serveLogs({ s: 3 }, () => failures-- > 0);
    const { result } = setup('s', 3);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.lines.map(l => l.m)).toEqual(['s 0', 's 1', 's 2']);
    await expect(result.current.loadAll()).resolves.toHaveLength(3);
  });

  it('will not hand out a log that is still incomplete', async () => {
    serveLogs({ s: 3 }, () => true);
    const { result } = setup('s', 3);

    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.loadAll()).rejects.toThrow('not fully loaded');
  });

  it('stops at a 500 mid-log but does not count the log as complete', async () => {
    const { fn } = serveLogs({ s: 1500 });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
        Number(new URL(String(input)).searchParams.get('from')) >= 1000
          ? new Response(JSON.stringify({ message: 'boom' }), { status: 500 })
          : fn(input, init)
      )
    );
    const { result } = setup('s', 1500);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.lines).toHaveLength(1000);
    await expect(result.current.loadAll()).rejects.toThrow('not fully loaded');
  });

  it('keeps reading after a brief run of 500s', async () => {
    const { fn } = serveLogs({ s: 3 });
    let failures = 2;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
        failures-- > 0 ? new Response(JSON.stringify({ message: 'boom' }), { status: 500 }) : fn(input, init)
      )
    );
    const { result } = setup('s', 3);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.lines).toHaveLength(3);
    await expect(result.current.loadAll()).resolves.toHaveLength(3);
  });

  it('does not count a log that runs dry before its line count as complete', async () => {
    // The API answers missing storage pages with nothing: 1000 of 1500 lines are readable.
    serveLogs({ s: 1000 });
    const { result } = setup('s', 1500);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.lines).toHaveLength(1000);
    await expect(result.current.loadAll()).rejects.toThrow('not fully loaded');
  });

  it('does not hand out the tail alone when the earlier lines come back empty', async () => {
    const { fn } = serveLogs({ s: 5000 });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
        Number(new URL(String(input)).searchParams.get('from')) < 4000
          ? new Response('[]', { status: 200 })
          : fn(input, init)
      )
    );
    const { result } = setup('s', 5000);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.hasEarlier).toBe(true);
    await expect(result.current.loadAll()).rejects.toThrow('not fully loaded');
  });

  it('does not hand out a log whose earlier chunk came back short', async () => {
    const { fn } = serveLogs({ s: 5000 });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const from = Number(new URL(String(input)).searchParams.get('from'));

        if (from !== 3000) {
          return fn(input, init);
        }
        const half = Array.from({ length: 500 }, (_, i) => ({ n: 3000 + i, m: `s ${3000 + i}`, t: 0 }));

        return new Response(JSON.stringify(half));
      })
    );
    const { result } = setup('s', 5000);

    await waitFor(() => expect(result.current.done).toBe(true));
    await expect(result.current.loadAll()).rejects.toThrow('not fully loaded');
  });

  it('stops loading earlier lines, without mixing the logs, when the step changes', async () => {
    serveLogs({ a: 5000, b: 3000 });
    const { result, rerender } = setup('a', 5000);

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.hasEarlier).toBe(true);

    const all = result.current.loadAll();

    rerender({ stepName: 'b', totalLines: 3000 });
    await expect(all).rejects.toThrow('step changed');
    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.lines.every(l => l.m.startsWith('b '))).toBe(true);
    expect(result.current.lines[0]!.n).toBe(2000);
  });
});

describe('useCoverageInfo', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks again on the next mount after a failed read, instead of keeping N/A', async () => {
    let fail = true;
    const { calls } = mockApi({
      'GET /coverage/info': () => (fail ? [500, { message: 'down' }] : { coverage: 80, projectUrl: 'https://sonar' })
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const build = {
      id: 3,
      steps: [
        { name: 'sd-setup-init', startTime: 'a' },
        { name: 'sd-teardown-screwdriver-coverage-bookend', endTime: 'b' }
      ]
    } as unknown as Build;
    const job = { id: 1, name: 'main' } as never;
    const first = renderHook(() => useCoverageInfo(build, job, { id: 4, name: 'p' }), { wrapper });

    await waitFor(() => expect(first.result.current.isError).toBe(true));
    first.unmount();
    fail = false;
    const second = renderHook(() => useCoverageInfo(build, job, { id: 4, name: 'p' }), { wrapper });

    await waitFor(() => expect(second.result.current.data?.coverage).toBe('80%'));
    expect(calls).toHaveLength(2);
  });
});
