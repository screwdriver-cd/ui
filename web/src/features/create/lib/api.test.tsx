import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach } from 'vitest';
import { ApiError } from '~/api/client';
import { mockApi } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import {
  createPipeline,
  ExistingPipelineError,
  openOnboardingPr,
  useAutoDeployKeys,
  useTrustedTemplates
} from './api';

afterEach(() => signOut());

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useTrustedTemplates', () => {
  it('fetches compact templates newest first and keeps only trusted === true', async () => {
    const { calls } = mockApi({
      'GET /templates': () => [
        { id: 1, name: 'node', namespace: 'sd', trusted: true },
        { id: 2, name: 'java', namespace: 'sd', trusted: false },
        { id: 3, name: 'go', namespace: 'sd' },
        { id: 4, name: 'odd', namespace: 'sd', trusted: 'true' }
      ]
    });
    const { wrapper } = setup();
    const { result } = renderHook(() => useTrustedTemplates(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(t => t.id)).toEqual([1]);
    expect(calls[0]?.path).toBe('/templates');
    expect(Object.fromEntries(calls[0]!.query)).toEqual({
      sortBy: 'createTime',
      sort: 'descending',
      compact: 'true'
    });
  });

  it('does not fetch until enabled', async () => {
    const { fn } = mockApi({ 'GET /templates': () => [] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useTrustedTemplates(false), {
      wrapper
    });

    await act(async () => {});
    expect(result.current.fetchStatus).toBe('idle');
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('useAutoDeployKeys', () => {
  const contexts = [
    {
      context: 'github:github.com',
      displayName: 'github.com',
      autoDeployKeyGeneration: true
    },
    {
      context: 'gitlab:gitlab.com',
      displayName: 'gitlab.com',
      autoDeployKeyGeneration: false
    }
  ];

  it('is true only when the signed-in SCM context generates deploy keys', async () => {
    signIn({ scmContext: 'github:github.com' });
    const { calls } = mockApi({ 'GET /auth/contexts': () => contexts });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAutoDeployKeys(), { wrapper });

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(calls[0]?.path).toBe('/auth/contexts');
  });

  it.each(['gitlab:gitlab.com', 'bitbucket:bitbucket.org'])(
    'is false once contexts load when %s does not generate deploy keys',
    async scmContext => {
      signIn({ scmContext });
      mockApi({ 'GET /auth/contexts': () => contexts });
      const { wrapper, queryClient } = setup();
      const { result } = renderHook(() => useAutoDeployKeys(), { wrapper });

      await waitFor(() =>
        expect(queryClient.getQueryData(['scm-contexts'])).toEqual(contexts)
      );
      expect(result.current).toBe(false);
    }
  );

  it('is false when the contexts cannot be loaded', async () => {
    signIn({ scmContext: 'github:github.com' });
    mockApi({ 'GET /auth/contexts': () => [500, { message: 'down' }] });
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useAutoDeployKeys(), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['scm-contexts'])?.status).toBe('error')
    );
    expect(result.current).toBe(false);
  });
});

describe('createPipeline', () => {
  const payload = {
    checkoutUrl: 'git@github.com:a/b.git#main',
    rootDir: 'app',
    autoKeysGeneration: true
  };

  it('posts the payload to /pipelines and resolves to the created pipeline', async () => {
    const { calls } = mockApi({
      'POST /pipelines': () => ({ id: 42, scmRepo: { branch: 'main' } })
    });

    await expect(createPipeline(payload)).resolves.toEqual({
      id: 42,
      scmRepo: { branch: 'main' }
    });
    expect(calls).toEqual([
      expect.objectContaining({
        method: 'POST',
        path: '/pipelines',
        body: payload
      })
    ]);
  });

  it('turns a 409 with an existing id into ExistingPipelineError', async () => {
    mockApi({
      'POST /pipelines': () => [
        409,
        { message: 'exists', data: { existingId: 7 } }
      ]
    });

    const error = await createPipeline(payload).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ExistingPipelineError);
    expect(error).toMatchObject({
      existingId: 7,
      message: 'Pipeline 7 already exists'
    });
  });

  it('rethrows the ApiError for a 409 without an existing id and for other failures', async () => {
    mockApi({ 'POST /pipelines': () => [409, { message: 'Conflict' }] });
    const conflict = await createPipeline(payload).catch((e: unknown) => e);

    expect(conflict).toBeInstanceOf(ApiError);
    expect(conflict).not.toBeInstanceOf(ExistingPipelineError);
    expect(conflict).toMatchObject({ status: 409, message: 'Conflict' });

    mockApi({
      'POST /pipelines': () => [
        500,
        { message: 'boom', data: { existingId: 7 } }
      ]
    });
    const failure = await createPipeline(payload).catch((e: unknown) => e);

    expect(failure).not.toBeInstanceOf(ExistingPipelineError);
    expect(failure).toMatchObject({ status: 500, message: 'boom' });
  });
});

describe('openOnboardingPr', () => {
  it('posts a screwdriver.yaml file with the onboarding title and message', async () => {
    const { calls } = mockApi({
      'POST /pipelines/:id/openPr': () => ({ prUrl: 'https://pr/1' })
    });

    await expect(
      openOnboardingPr(5, 'git@github.com:a/b.git', 'jobs: {}\n')
    ).resolves.toBe('https://pr/1');
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/pipelines/5/openPr',
      body: {
        checkoutUrl: 'git@github.com:a/b.git',
        files: [{ name: 'screwdriver.yaml', content: 'jobs: {}\n' }],
        title: 'Onboard to Screwdriver',
        message: 'Add screwdriver.yaml file'
      }
    });
  });

  it('puts screwdriver.yaml inside the source directory, which the API does not add', async () => {
    const { calls } = mockApi({
      'POST /pipelines/:id/openPr': () => ({ prUrl: 'https://pr/1' })
    });

    await openOnboardingPr(5, 'u', 'y', ' /services/api/ ');
    await openOnboardingPr(5, 'u', 'y', '');
    expect(
      calls.map(
        c => (c.body as { files: Array<{ name: string }> }).files[0]!.name
      )
    ).toEqual(['services/api/screwdriver.yaml', 'screwdriver.yaml']);
  });

  it('reads the url from payload.prUrl and falls back to an empty string', async () => {
    let response: unknown = { payload: { prUrl: 'https://pr/2' } };

    mockApi({ 'POST /pipelines/:id/openPr': () => response });
    await expect(openOnboardingPr(5, 'u', 'y')).resolves.toBe('https://pr/2');

    response = {};
    await expect(openOnboardingPr(5, 'u', 'y')).resolves.toBe('');

    response = undefined;
    await expect(openOnboardingPr(5, 'u', 'y')).resolves.toBe('');
  });

  it('propagates API failures', async () => {
    mockApi({
      'POST /pipelines/:id/openPr': () => [403, { message: 'Forbidden' }]
    });

    await expect(openOnboardingPr(5, 'u', 'y')).rejects.toMatchObject({
      status: 403,
      message: 'Forbidden'
    });
  });
});
