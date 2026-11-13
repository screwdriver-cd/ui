import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from '../routes';

const pipeline = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};

describe('pipeline preferences', () => {
  beforeEach(() => signIn());

  it('stores "Show PR jobs" under this pipeline, keeping other settings', async () => {
    const { fn } = mockFetch([
      [
        /\/users\/settings$/,
        (_url, init) =>
          init?.method === 'PUT'
            ? {}
            : { timestampFormat: 'UTC', '9': { showPRJobs: false } }
      ],
      [/\/pipelines\/1$/, () => pipeline]
    ]);

    await renderFeature(createRoutes, '/v2/pipelines/1/settings/preferences');
    await userEvent.click(await screen.findByLabelText(/show PR jobs/i));

    // Saving reads the stored settings first, so the PUT comes after another round trip.
    await vi.waitFor(() => {
      const put = fn.mock.calls.find(([, init]) => init?.method === 'PUT');

      expect(JSON.parse(put?.[1]?.body as string)).toEqual({
        settings: {
          timestampFormat: 'UTC',
          '9': { showPRJobs: false },
          '1': { showPRJobs: false }
        }
      });
    });
  });
});

const job = (id: number, name: string, state = 'ENABLED', extra = {}) => ({
  id,
  name,
  pipelineId: 1,
  state,
  permutations: [{ annotations: {} }],
  ...extra
});
const jobs = [
  job(11, 'main'),
  job(12, 'deploy', 'DISABLED', { stateChanger: 'robin', stateChangeMessage: 'broken' }),
  job(13, 'test')
];
const withJobs = (extra: Array<[RegExp, () => unknown]> = []) =>
  mockFetch([
    [/\/users\/settings$/, () => ({})],
    [/\/pipelines\/1\/jobs$/, () => jobs],
    [/\/pipelines\/1\/admins$/, () => [{ username: 'batman', scmContext: 'github:x' }]],
    ...extra,
    [/\/pipelines\/1$/, () => pipeline]
  ]);

describe('pipeline settings pages', () => {
  beforeEach(() => signIn());

  it('opens on the Pipeline tab of five, with the checkout URL and the admins', async () => {
    withJobs();
    await renderFeature(createRoutes, '/v2/pipelines/1/settings');

    expect(await screen.findByText('Checkout URL and source directory')).toBeInTheDocument();

    const links = [...document.querySelectorAll('.settings-tabs a')];

    expect(links.map(l => l.textContent)).toEqual([
      'Pipeline',
      'Jobs',
      'Cache',
      'Metrics',
      'Preferences'
    ]);
    expect(screen.getByText('Admins')).toBeInTheDocument();
    expect(await screen.findByText('batman')).toBeInTheDocument();
  });

  it('saves the pipeline alias with a PUT', async () => {
    const { fn } = withJobs([[/\/pipelines\/1$/, () => pipeline]]);

    await renderFeature(createRoutes, '/v2/pipelines/1/settings');
    await userEvent.click(await screen.findByLabelText('Edit pipeline alias'));
    await userEvent.type(await screen.findByLabelText('Alias'), 'bat');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await vi.waitFor(() => {
      const put = fn.mock.calls.find(([, init]) => init?.method === 'PUT');

      expect(JSON.parse(put?.[1]?.body as string)).toEqual({
        settings: { aliasName: 'bat' }
      });
    });
  });

  it('disables several jobs at once with a reason', async () => {
    const puts: Array<{ path: string; body: unknown }> = [];
    let jobLoads = 0;
    mockFetch([
      [/\/users\/settings$/, () => ({})],
      [/\/pipelines\/1\/jobs$/, () => (jobLoads++, jobs)],
      [
        /\/jobs\/\d+$/,
        (url, init) => {
          puts.push({ path: url.pathname, body: JSON.parse(init?.body as string) });

          return {};
        }
      ],
      [/\/pipelines\/1$/, () => pipeline]
    ]);

    await renderFeature(createRoutes, '/v2/pipelines/1/settings/jobs');
    await userEvent.click(await screen.findByRole('button', { name: 'Disable multiple jobs' }));
    expect(jobLoads).toBe(1);

    // Only enabled jobs are listed in multi mode.
    expect(screen.queryByText('deploy')).toBeNull();
    await userEvent.click(screen.getByLabelText('Select all rows on this page'));
    expect(screen.getByText('2 jobs selected.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Disable selected jobs' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Disable 2 jobs?')).toBeTruthy();
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'freeze');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disable' }));

    await vi.waitFor(() => expect(puts).toHaveLength(2));
    expect(puts.map(p => p.path.replace(/^.*\/jobs\//, '')).sort()).toEqual(['11', '13']);
    expect(puts[0]?.body).toEqual({ state: 'DISABLED', stateChangeMessage: 'freeze' });
    // The table's job list is reloaded so the switches show the new states.
    await vi.waitFor(() => expect(jobLoads).toBe(2));
  });

  it('clears the pipeline cache', async () => {
    const deletes: string[] = [];

    mockFetch([
      [/\/users\/settings$/, () => ({})],
      [/\/pipelines\/1\/jobs$/, () => jobs],
      [
        /\/pipelines\/1\/caches$/,
        (url, init) => {
          if (init?.method === 'DELETE') {
            deletes.push(url.search);
          }

          return {};
        }
      ],
      [/\/pipelines\/1$/, () => pipeline]
    ]);

    await renderFeature(createRoutes, '/v2/pipelines/1/settings/cache');
    await userEvent.click(await screen.findByRole('button', { name: 'Clear pipeline cache' }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear' }));
    await vi.waitFor(() => expect(deletes).toEqual(['?scope=pipelines&cacheId=1']));
  });

  it('includes a job in downtime metrics, treating an empty list as "all jobs"', async () => {
    const { fn } = mockFetch([
      [/\/users\/settings$/, () => ({})],
      [/\/pipelines\/1\/jobs$/, () => jobs],
      [
        /\/pipelines\/1$/,
        () => ({ ...pipeline, settings: { metricsDowntimeJobs: [11, 12] } })
      ]
    ]);

    await renderFeature(createRoutes, '/v2/pipelines/1/settings/metrics');
    await userEvent.click(await screen.findByLabelText('Include test in downtime metrics'));

    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Include' }));
    await vi.waitFor(() => {
      const put = fn.mock.calls.find(([, init]) => init?.method === 'PUT');

      expect(JSON.parse(put?.[1]?.body as string)).toEqual({
        settings: { metricsDowntimeJobs: [11, 12, 13] }
      });
    });
  });

  it('saves the pipeline preference "filter events with no builds"', async () => {
    const { fn } = withJobs();

    await renderFeature(createRoutes, '/v2/pipelines/1/settings/preferences');
    await userEvent.click(await screen.findByLabelText('Toggle filtering of events with no builds'));
    await vi.waitFor(() => {
      const put = fn.mock.calls.find(([, init]) => init?.method === 'PUT');

      expect(JSON.parse(put?.[1]?.body as string)).toEqual({
        settings: { filterEventsForNoBuilds: true }
      });
    });
  });
});
