import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { config } from '~/config/config';
import { patchProperty } from '~/test/patch';
import { getSession } from '~/auth/session';
import { mockLayout } from '~/test/layout';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { buildKey } from './api';
import { createRoutes } from './routes';
import type { Build } from './types';

const step = (name: string, extra: object = {}) => ({
  name,
  startTime: '2020-01-01T10:00:00.000Z',
  endTime: '2020-01-01T10:00:10.000Z',
  code: 0,
  lines: 2,
  ...extra
});

const failedBuild: Build = {
  id: 100,
  jobId: 1,
  eventId: 5,
  sha: 'c96f36886e084d18bd068b8156d095cd9b31e1d6',
  container: 'node:20',
  status: 'FAILURE',
  createTime: '2020-01-01T09:59:00.000Z',
  startTime: '2020-01-01T10:00:00.000Z',
  endTime: '2020-01-01T10:05:00.000Z',
  steps: [step('sd-setup-init'), step('install', { code: 137 }), step('test', { startTime: undefined, endTime: undefined, code: undefined, lines: undefined })]
};

const job = { id: 1, name: 'main', pipelineId: 4, state: 'ENABLED' };
const event = {
  id: 5,
  sha: failedBuild.sha,
  commit: { message: 'fix things', url: 'https://github.com/o/r/commit/c96f', author: { name: 'Bruce', url: 'https://github.com/bruce' } }
};

function routes(build: Build = failedBuild, extra: Parameters<typeof mockFetch>[0] = []) {
  return mockFetch([
    ...extra,
    [/\/builds\/100\/steps\/install\/logs$/, url => (url.searchParams.get('from') === '0' ? [{ t: 1577872800000, m: 'npm \u001b[32minstall\u001b[0m', n: 0 }, { t: 1577872801000, m: 'boom', n: 1 }] : [])],
    [/\/builds\/100\/artifacts\/manifest\.txt$/, () => './report.html\n./cov/index.html\n'],
    [/\/builds\/100$/, () => build],
    [/\/jobs\/1$/, () => job],
    [/\/events\/5$/, () => event],
    [/\/pipelines\/4$/, () => ({ id: 4, name: 'p', state: 'ACTIVE' })],
    [/\/users\/settings$/, () => ({})]
  ]);
}

describe('BuildPage', () => {
  beforeEach(() => {
    mockLayout();
    signIn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('opens the failed step and shows its log, banner and steps', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100');

    expect(await screen.findByText('boom')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/steps/install');
    // The log has no landmark role or accessible name; scope by its test id so the step button's "install" is excluded.
    expect(within(screen.getByRole('log', { name: 'Build log' })).getByText('install')).toBeInTheDocument();
    const banner = screen.getByRole('list', { name: 'Build summary' });

    expect(within(banner).getByRole('link', { name: 'main' })).toHaveAttribute('href', '/v2/pipelines/4/events/5?jobId=1');
    expect(within(banner).getByText('#c96f368')).toHaveAttribute('href', 'https://github.com/o/r/commit/c96f');
    expect(within(banner).getByText('node:20')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /install/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled();
  });

  it('selects a step on click and updates the URL', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100');

    await screen.findByText('boom');
    await userEvent.click(screen.getByRole('button', { name: /test/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/steps/test'));
    expect(await screen.findByText('This step has not started yet.')).toBeInTheDocument();
  });

  it('restores the picked step when coming back from the Artifacts tab', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100');

    await screen.findByText('boom');
    await userEvent.click(screen.getByRole('button', { name: /test/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/steps/test'));

    await userEvent.click(screen.getByRole('tab', { name: 'Artifacts' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/artifacts'));

    await userEvent.click(screen.getByRole('tab', { name: 'Steps' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/steps/test'));
    expect(await screen.findByText('This step has not started yet.')).toBeInTheDocument();
  });

  it('shows the synthesised log for sd-setup-init without calling the logs API', async () => {
    const { calls } = routes();

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/sd-setup-init');
    expect(await screen.findByText('Build created.')).toBeInTheDocument();
    expect(calls.filter(c => c.path.endsWith('/logs'))).toHaveLength(0);
  });

  it('redirects an unknown step back to the build', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/nope');

    await waitFor(() => expect(router.state.location.pathname).toMatch(/steps\/install$/));
  });

  it('lists artifacts from the manifest and previews through the API host', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/artifacts');

    expect(await screen.findByRole('link', { name: 'report.html' })).toBeInTheDocument();
    expect(screen.getByTitle('Artifact preview')).toHaveAttribute(
      'src',
      'http://localhost:8080/v4/builds/100/artifacts/manifest.txt?type=preview'
    );
    await userEvent.click(screen.getByRole('link', { name: 'report.html' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/artifacts/report.html'));
    expect(screen.getByTitle('Artifact preview')).toHaveAttribute(
      'src',
      'http://localhost:8080/v4/builds/100/artifacts/report.html?type=preview'
    );
    // Build-controlled HTML runs scripts, but in an opaque origin: never with the API session.
    const sandbox = screen.getByTitle('Artifact preview').getAttribute('sandbox')?.split(' ');

    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(open).toHaveBeenCalledWith(
      'http://localhost:8080/v4/builds/100/artifacts/report.html?type=download',
      '_blank',
      'noopener'
    );
  });

  it('selects directories with a trailing slash and the root through the heading', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/artifacts');
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    await userEvent.click(await screen.findByRole('button', { name: /cov/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/artifacts/cov'));
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(open).toHaveBeenCalledWith(
      'http://localhost:8080/v4/builds/100/artifacts/cov?type=download&dir=true',
      '_blank',
      'noopener'
    );

    await userEvent.click(screen.getByRole('link', { name: 'Artifacts' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/artifacts'));
    expect(await screen.findByRole('button', { name: 'Download All' })).toBeInTheDocument();
  });

  it('keeps "#", "?" and "%" in artifact names as part of the path', async () => {
    routes(undefined, [[/\/builds\/100\/artifacts\/manifest\.txt$/, () => './a #1?.txt\n./d%20x/b.txt\n']]);
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/artifacts');

    const file = await screen.findByRole('link', { name: 'a #1?.txt' });

    expect(file).toHaveAttribute('href', '/pipelines/4/builds/100/artifacts/a%20%231%3F.txt');
    await userEvent.click(file);
    await waitFor(() =>
      expect(screen.getByTitle('Artifact preview')).toHaveAttribute(
        'src',
        'http://localhost:8080/v4/builds/100/artifacts/a%20%231%3F.txt?type=preview'
      )
    );
    expect(router.state.location.search).toEqual({});

    await userEvent.click(screen.getByRole('button', { name: /d%20x/ }));
    expect(await screen.findByRole('link', { name: 'b.txt' })).toHaveAttribute(
      'href',
      '/pipelines/4/builds/100/artifacts/d%2520x/b.txt'
    );
  });

  it('says there are no artifacts when the manifest is missing', async () => {
    routes(failedBuild, [[/manifest\.txt$/, () => new Response('{}', { status: 404 })]]);
    await renderFeature(createRoutes, '/pipelines/4/builds/100/artifacts');
    expect(await screen.findByText('No artifacts yet')).toBeInTheDocument();
  });

  it('restarts from the build and navigates to the new build', async () => {
    const { calls, fn } = routes(failedBuild, [
      [/\/events$/, () => ({ id: 6 })],
      [/\/events\/6\/builds$/, () => [{ ...failedBuild, id: 101 }]],
      [/\/builds\/101$/, () => ({ ...failedBuild, id: 101, steps: [] })]
    ]);
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');

    await screen.findByText('boom');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/101'));
    const post = fn.mock.calls.find(([, init]) => init?.method === 'POST');

    expect(JSON.parse(post?.[1]?.body as string)).toEqual({
      buildId: 100,
      causeMessage: 'Manually started by batman',
      startAction: 'RESTART_FROM_BUILD'
    });
    expect(calls.some(c => c.path.endsWith('/events/6/builds'))).toBe(true);
  });

  it('asks to switch accounts instead of restarting a pipeline of another SCM', async () => {
    getSession().set({ username: 'batman', scope: ['user'], scmContext: 'github:github.com', isGuest: false, token: 'x' });
    const { fn } = routes(failedBuild, [
      [/\/pipelines\/4$/, () => ({ id: 4, name: 'p', state: 'ACTIVE', scmContext: 'github:target.example' })],
      [/\/auth\/contexts$/, () => [{ context: 'github:target.example', displayName: 'Target' }]]
    ]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');
    await screen.findByText('boom');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));

    expect(await screen.findByText(/sign in to Target/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull();
    expect(fn.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
    expect(getSession().data).not.toBeNull();
  });

  it('stops a running build', async () => {
    const running: Build = { ...failedBuild, status: 'RUNNING', endTime: undefined, steps: [step('install', { endTime: undefined, code: undefined, lines: undefined })] };
    const { fn } = routes(running, [[/\/builds\/100$/, (_u, init) => (init?.method === 'PUT' ? { ...running, status: 'ABORTED' } : running)]]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');
    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(fn.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true));
    const put = fn.mock.calls.find(([, init]) => init?.method === 'PUT');

    expect(JSON.parse(put?.[1]?.body as string)).toEqual({ status: 'ABORTED' });
  });

  it('goes to the new event, and does not offer a second restart, when its builds fail to load', async () => {
    const { fn } = routes(failedBuild, [
      [/\/events$/, () => ({ id: 6 })],
      [/\/events\/6\/builds$/, () => new Response('{"message":"boom"}', { status: 502 })]
    ]);
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');

    await screen.findByText('boom');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/v2/pipelines/4/events/6'));
    expect(fn.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it('closes the Stop confirmation, instead of restarting, when the build finishes while it is open', async () => {
    const running: Build = { ...failedBuild, status: 'RUNNING', endTime: undefined, steps: [step('install', { endTime: undefined, code: undefined, lines: undefined })] };
    const { fn } = routes(running);
    const { queryClient } = await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');

    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(await screen.findByRole('button', { name: 'Yes' })).toBeInTheDocument();

    // What the next poll would bring: the build has ended.
    act(() => queryClient.setQueryData(buildKey('100'), failedBuild));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull());
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
    expect(fn.mock.calls.some(([, init]) => init?.method === 'POST' || init?.method === 'PUT')).toBe(false);
  });

  it('closes an open Stop confirmation when Back moves to another running build', async () => {
    const running = (id: number): Build => ({ ...failedBuild, id, status: 'RUNNING', endTime: undefined, steps: [step('install', { endTime: undefined, code: undefined, lines: undefined })] });
    const { fn } = routes(failedBuild, [
      [/\/builds\/(100|101)\/steps\/install\/logs$/, () => []],
      [/\/builds\/101$/, () => running(101)],
      [/\/builds\/100$/, () => running(100)]
    ]);
    const { router } = await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');

    await screen.findByRole('button', { name: 'Stop' });
    await act(() => router.navigate({ to: '/pipelines/4/builds/101/steps/install' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(await screen.findByRole('button', { name: 'Yes' })).toBeInTheDocument();

    await act(async () => router.history.back());
    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/100/steps/install'));

    expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull();
    expect(fn.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });

  it('hides the action button for logged-out users and disables restart for disabled jobs', async () => {
    getSession().set(null);
    routes();
    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');
    await screen.findByTestId('build-banner');
    expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
  });

  it('keeps polling a running step for new log lines', async () => {
    patchProperty(config, 'logReloadTimer', { value: 20, writable: true });
    const running: Build = { ...failedBuild, status: 'RUNNING', endTime: undefined, steps: [step('install', { endTime: undefined, code: undefined, lines: undefined })] };
    let polls = 0;

    routes(running, [
      [
        /\/builds\/100\/steps\/install\/logs$/,
        url => {
          const from = Number(url.searchParams.get('from'));

          if (from === 0) return [{ t: 1, m: 'first', n: 0 }];
          // The tail probe reads far past the end of this short log.
          if (from > 1) return [];
          polls += 1;

          return polls > 1 ? [{ t: 2, m: 'second', n: 1 }] : [];
        }
      ]
    ]);
    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install');
    expect(await screen.findByText('first')).toBeInTheDocument();
    expect(await screen.findByText('second')).toBeInTheDocument();
  });

  it('shows not found for a missing build', async () => {
    mockFetch([[/\/builds\/999$/, () => new Response('{"message":"nope"}', { status: 404 })]]);
    await renderFeature(createRoutes, '/pipelines/4/builds/999');
    expect(await screen.findByText('Build not found')).toBeInTheDocument();
  });

  it('renders Japanese strings', async () => {
    routes();
    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/install', { locale: 'ja' });
    expect(await screen.findByRole('button', { name: '再実行' })).toBeInTheDocument();
    expect(screen.getByText('コミッター')).toBeInTheDocument();
  });

  it('redirects /builds/:id to the pipeline build URL', async () => {
    routes();
    const { router } = await renderFeature(createRoutes, '/builds/100');

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/pipelines\/4\/builds\/100/));
  });
});
