import { screen, waitFor } from '@testing-library/react';
import { config } from '~/config/config';
import { patchProperty } from '~/test/patch';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from '../routes';

const pipeline = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};

describe('pulls page', () => {
  beforeEach(() => signIn());

  it('rejects a non-PR event id and offers the newest pull request', async () => {
    mockFetch([
      [/\/events\/9$/, () => ({ id: 9, type: 'pipeline', pipelineId: 1 })],
      [
        /\/pipelines\/1\/events$/,
        () => [{ id: 30, type: 'pr', pipelineId: 1, prNum: 3 }]
      ],
      [
        /\/pipelines\/1\/jobs$/,
        () => [{ id: 5, name: 'PR-3:main', pipelineId: 1 }]
      ],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/pulls/9');

    expect(
      await screen.findByText(/Event 9 does not exist/)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Open the newest pull request' })
    ).toHaveAttribute('href', '/v2/pipelines/1/pulls/30');
  });
  it('does not report "no open pull requests" while the PR list is loading', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => (release = resolve));

    mockFetch([
      [
        /\/pipelines\/1\/events$/,
        () => [{ id: 30, type: 'pr', pipelineId: 1, prNum: 3 }]
      ],
      [
        /\/events\/30$/,
        () => ({ id: 30, type: 'pr', pipelineId: 1, prNum: 3 })
      ],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    const stubbed = globalThis.fetch as unknown as (
      i: RequestInfo | URL,
      init?: RequestInit
    ) => Promise<Response>;

    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (/\/pipelines\/1\/jobs$/.test(new URL(String(input)).pathname)) {
          await gate;

          return new Response(
            JSON.stringify([{ id: 5, name: 'PR-3:main', pipelineId: 1 }])
          );
        }

        return stubbed(input, init);
      }
    );
    const { router } = await renderFeature(
      createRoutes,
      '/v2/pipelines/1/pulls'
    );

    await screen.findByRole('status');
    expect(screen.queryByText(/no open pull requests/i)).toBeNull();
    release();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/v2/pipelines/1/pulls/30')
    );
  });
});

describe('events page', () => {
  beforeEach(() => signIn());

  it('offers Start New on a pipeline without events', async () => {
    mockFetch([
      [/\/pipelines\/1\/events/, () => []],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/events');

    expect(await screen.findByText(/no events/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Start a new event' })
    ).toBeEnabled();
  });

  it('opens the first event of an empty pipeline once it appears', async () => {
    let events: object[] = [];

    patchProperty(config, 'eventReloadTimer', { value: 50, writable: true });
    mockFetch([
      [/\/pipelines\/1\/events/, () => events],
      [/\/events\/7$/, () => ({ id: 7, type: 'pipeline', pipelineId: 1 })],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    const { router } = await renderFeature(
      createRoutes,
      '/v2/pipelines/1/events'
    );

    expect(await screen.findByText(/no events/i)).toBeInTheDocument();
    events = [{ id: 7, type: 'pipeline', pipelineId: 1 }];
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/v2/pipelines/1/events/7')
    );
  });

  it('reports a failed read instead of "no events", and recovers', async () => {
    let fail = true;

    patchProperty(config, 'eventReloadTimer', { value: 50, writable: true });
    mockFetch([
      [
        /\/pipelines\/1\/events/,
        () => (fail ? 500 : [{ id: 7, type: 'pipeline', pipelineId: 1 }])
      ],
      [/\/events\/7$/, () => ({ id: 7, type: 'pipeline', pipelineId: 1 })],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    const { router } = await renderFeature(
      createRoutes,
      '/v2/pipelines/1/events'
    );

    expect(
      await screen.findByText('Something went wrong.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/no events/i)).toBeNull();
    fail = false;
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/v2/pipelines/1/events/7')
    );
  });

  it('links to the last successful and latest commit events from the rail', async () => {
    mockFetch([
      [
        /\/lastSuccessfulEvent$/,
        () => ({ id: 12, type: 'pipeline', pipelineId: 1 })
      ],
      [
        /\/latestCommitEvent$/,
        () => ({ id: 20, type: 'pipeline', pipelineId: 1, sha: 'abc' })
      ],
      [/\/events\/30$/, () => ({ id: 30, type: 'pipeline', pipelineId: 1 })],
      [
        /\/pipelines\/1\/events/,
        () => [{ id: 30, type: 'pipeline', pipelineId: 1 }]
      ],
      [/\/pipelines\/1\/jobs/, () => []],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/events/30');

    expect(
      await screen.findByRole('link', {
        name: 'Go to the last successful event'
      })
    ).toHaveAttribute('href', '/v2/pipelines/1/events/12');
    expect(
      await screen.findByRole('link', {
        name: "Go to the latest commit's event"
      })
    ).toHaveAttribute('href', '/v2/pipelines/1/events/20');
  });

  it("treats another pipeline's event as not found", async () => {
    mockFetch([
      [/\/events\/9$/, () => ({ id: 9, type: 'pipeline', pipelineId: 2 })],
      [
        /\/pipelines\/1\/events/,
        () => [{ id: 30, type: 'pipeline', pipelineId: 1 }]
      ],
      [/\/pipelines\/1\/jobs/, () => []],
      [/\/pipelines\/1$/, () => pipeline],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/events/9');

    expect(
      await screen.findByText(/Event 9 does not exist/)
    ).toBeInTheDocument();
  });
});
