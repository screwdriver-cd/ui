import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { mockFetch } from '~/test/feature-router';
import type { Build, Job } from '../types';
import {
  keys,
  useEventStageBuilds,
  useJobCoverage,
  usePrNums
} from './queries';

afterEach(() => vi.unstubAllGlobals());

describe('useJobCoverage', () => {
  it("asks for a PR job's coverage with its PR, pipeline and scope", async () => {
    const { calls } = mockFetch([
      [/\/coverage\/info$/, () => ({ coverage: '50' })]
    ]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const build = {
      id: 9,
      jobId: 5,
      status: 'SUCCESS',
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-01-01T00:05:00Z'
    } as Build;
    const job = {
      id: 5,
      name: 'PR-12:main',
      prParentJobId: 1,
      permutations: [
        { annotations: { 'screwdriver.cd/coverageScope': 'pipeline' } }
      ]
    } as unknown as Job;
    const { result } = renderHook(
      () => useJobCoverage(job, build, { id: 4, name: 'p' }, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBe('50'));
    const query = new URLSearchParams(calls[0]?.search);

    expect(query.get('prNum')).toBe('12');
    expect(query.get('pipelineId')).toBe('4');
    expect(query.get('prParentJobId')).toBe('1');
    expect(query.get('scope')).toBe('pipeline');
  });

  it('fetches coverage once a build that was running has ended', async () => {
    const { calls } = mockFetch([
      [
        /\/coverage\/info$/,
        url => (url.searchParams.get('endTime') ? { coverage: '87' } : {})
      ]
    ]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const running = {
      id: 9,
      jobId: 1,
      status: 'RUNNING',
      startTime: '2026-01-01T00:00:00Z'
    } as Build;
    const { result, rerender } = renderHook(
      ({ build }: { build: Build }) =>
        useJobCoverage(
          { id: 1, name: 'main' },
          build,
          { id: 4, name: 'p' },
          true
        ),
      { wrapper, initialProps: { build: running } }
    );

    rerender({
      build: { ...running, status: 'SUCCESS', endTime: '2026-01-01T00:05:00Z' }
    });

    await waitFor(() => expect(result.current.data).toBe('87'));
    expect(calls.filter(c => c.path.endsWith('/coverage/info'))).toHaveLength(
      1
    );
  });
});

describe('useEventStageBuilds', () => {
  it('reads the stage builds once more when polling stops', async () => {
    let status = 'RUNNING';
    const { calls } = mockFetch([
      [/\/events\/5\/stageBuilds$/, () => [{ id: 1, stageId: 2, status }]]
    ]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ poll }: { poll: boolean }) => useEventStageBuilds(5, true, poll),
      { wrapper, initialProps: { poll: true } }
    );

    await waitFor(() =>
      expect(result.current.data?.[0]?.status).toBe('RUNNING')
    );
    status = 'SUCCESS';
    rerender({ poll: false });

    await waitFor(() =>
      expect(result.current.data?.[0]?.status).toBe('SUCCESS')
    );
    expect(calls).toHaveLength(2);
  });
});

describe('usePrNums', () => {
  it('refreshes the shared PR jobs list it reads, so a new PR has its jobs', async () => {
    const prJobs = [
      { id: 50, name: 'PR-7:main', pipelineId: 1 },
      { id: 60, name: 'PR-8:main', pipelineId: 1 }
    ];

    mockFetch([[/\/pipelines\/1\/jobs$/, () => prJobs]]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    queryClient.setQueryData(keys.jobs(1, 'pr'), [prJobs[0]]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => usePrNums(1), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([7, 8]));
    expect(queryClient.getQueryData(keys.jobs(1, 'pr'))).toEqual(prJobs);
  });
});
