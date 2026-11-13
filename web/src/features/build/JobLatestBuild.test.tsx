import { screen, waitFor, within } from '@testing-library/react';
import { getSession } from '~/auth/session';
import { mockLayout } from '~/test/layout';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from './routes';
import { resolveCoverage } from './utils';

const step = (name: string, extra: object = {}) => ({
  name,
  startTime: '2020-01-01T10:00:00.000Z',
  endTime: '2020-01-01T10:00:10.000Z',
  code: 0,
  lines: 0,
  ...extra
});

describe('job latest build route', () => {
  beforeEach(() => {
    mockLayout();
    signIn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  const cases: Array<[string, string, string]> = [
    ['/pipelines/4/jobs/main', '', '/pipelines/4/builds/77'],
    ['/pipelines/4/jobs/main/steps/test', '', '/pipelines/4/builds/77/steps/test'],
    ['/pipelines/4/jobs/main/artifacts', '', '/pipelines/4/builds/77/artifacts'],
    ['/pipelines/4/jobs/main/artifacts/cov/index.html', '', '/pipelines/4/builds/77/artifacts/cov/index.html'],
    // '#' and '?' stay encoded (the router shows the space decoded)
    ['/pipelines/4/jobs/main/artifacts/a%20%231%3F.txt', '', '/pipelines/4/builds/77/artifacts/a %231%3F.txt']
  ];

  it.each(cases)('%s resolves the latest build', async (url, _s, expected) => {
    const { calls } = mockFetch([
      [/\/pipelines\/4\/jobs\/main\/latestBuild$/, () => ({ id: 77 })],
      [/.*/, () => ({})]
    ]);
    const { router } = await renderFeature(createRoutes, url);

    await waitFor(() => expect(router.state.location.pathname).toBe(expected));
    expect(calls.some(c => c.path.endsWith('/jobs/main/latestBuild'))).toBe(true);
  });

  it('forwards the status filter upper-cased and encodes the job name', async () => {
    const { calls } = mockFetch([
      [/latestBuild$/, () => ({ id: 9 })],
      [/.*/, () => ({})]
    ]);
    const { router } = await renderFeature(createRoutes, '/pipelines/4/jobs/PR-1%3Amain?status=failure');

    await waitFor(() => expect(router.state.location.pathname).toBe('/pipelines/4/builds/9'));
    const call = calls.find(c => c.path.endsWith('latestBuild'));

    expect(call?.path).toContain('/jobs/PR-1%3Amain/latestBuild');
    expect(call?.search).toBe('?status=FAILURE');
  });

  it('sends the v2 build URL to the build page', async () => {
    mockFetch([[/.*/, () => ({})]]);
    const { router } = await renderFeature(createRoutes, '/v2/pipelines/4/builds/100');

    expect(router.state.location.pathname).toBe('/pipelines/4/builds/100');
  });

  it('shows a not-found message when the job has no build', async () => {
    mockFetch([[/latestBuild$/, () => new Response('{"message":"none"}', { status: 404 })]]);
    await renderFeature(createRoutes, '/pipelines/4/jobs/ghost');

    expect(await screen.findByText('No build found for job ghost.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the pipeline' })).toHaveAttribute('href', '/v2/pipelines/4/events');
  });
});

describe('banner coverage', () => {
  beforeEach(() => {
    mockLayout();
    signIn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  const build = (extra: object = {}) => ({
    id: 100,
    jobId: 1,
    eventId: 5,
    sha: 'abc',
    status: 'SUCCESS',
    createTime: '2020-01-01T09:59:00.000Z',
    startTime: '2020-01-01T10:00:00.000Z',
    endTime: '2020-01-01T10:05:00.000Z',
    steps: [step('sd-setup-init'), step('test'), step('sd-teardown-screwdriver-coverage-bookend')],
    ...extra
  });

  const base = (b: object, coverage: () => unknown) =>
    mockFetch([
      [/\/coverage\/info$/, coverage],
      [/\/builds\/100$/, () => b],
      [/\/jobs\/1$/, () => ({ id: 1, name: 'PR-3:main', pipelineId: 4, permutations: [{ annotations: { 'screwdriver.cd/coverageScope': 'pipeline' } }] })],
      [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
      [/\/pipelines\/4$/, () => ({ id: 4, name: 'my-pipe', state: 'ACTIVE' })],
      [/\/builds\/100\/steps\/.*\/logs$/, () => []],
      [/\/users\/settings$/, () => ({})]
    ]);

  it('asks the coverage endpoint about this build and job and links the result', async () => {
    const { calls } = base(build(), () => ({ coverage: '81.5', tests: '10/12', projectUrl: 'https://sonar/x' }));

    await renderFeature(createRoutes, '/pipelines/4/builds/100');
    const banner = await screen.findByTestId('build-banner');

    expect(await within(banner).findByText('81.5%')).toHaveAttribute('href', 'https://sonar/x');
    expect(within(banner).getByText('10/12')).toHaveAttribute('href', 'https://sonar/x');
    const q = new URLSearchParams(calls.find(c => c.path.endsWith('/coverage/info'))?.search);

    expect(Object.fromEntries(q)).toMatchObject({
      buildId: '100',
      jobId: '1',
      pipelineId: '4',
      pipelineName: 'my-pipe',
      jobName: 'PR-3:main',
      prNum: '3',
      scope: 'pipeline',
      startTime: '2020-01-01T10:00:00.000Z',
      endTime: '2020-01-01T10:00:10.000Z'
    });
  });

  it('does not ask before the coverage step has finished, and degrades to N/A on error', async () => {
    const pending = build({ steps: [step('test'), step('sd-teardown-screwdriver-coverage-bookend', { endTime: undefined })] });
    const { calls } = base(pending, () => new Response('{}', { status: 500 }));

    await renderFeature(createRoutes, '/pipelines/4/builds/100');
    const banner = await screen.findByTestId('build-banner');

    expect(within(banner).getAllByText('N/A')).toHaveLength(2);
    expect(calls.some(c => c.path.endsWith('/coverage/info'))).toBe(false);
  });

  it('does not ask while the pipeline is unavailable for coverage', async () => {
    const { calls } = mockFetch([
      [/\/coverage\/info$/, () => ({ coverage: '5', tests: '1/1', projectUrl: 'https://s' })],
      [/\/builds\/100$/, () => build()],
      [/\/jobs\/1$/, () => ({ id: 1, name: 'main', pipelineId: 4 })],
      [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
      [/\/pipelines\/4$/, () => new Response('{}', { status: 500 })],
      [/\/builds\/100\/steps\/.*\/logs$/, () => []],
      [/\/users\/settings$/, () => ({})]
    ]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100');
    await screen.findByTestId('build-banner');
    expect(calls.some(c => c.path.endsWith('/coverage/info'))).toBe(false);
  });

  it('build meta overrides the endpoint values', async () => {
    base(build({ meta: { tests: { coverage: '90.126', results: '3/3' } } }), () => ({ coverage: '10', tests: '1/9', projectUrl: 'https://s' }));
    await renderFeature(createRoutes, '/pipelines/4/builds/100');
    const banner = await screen.findByTestId('build-banner');

    expect(await within(banner).findByText('90.13%')).toBeInTheDocument();
    expect(within(banner).getByText('3/3')).toBeInTheDocument();
  });
});

describe('resolveCoverage', () => {
  const remote = { coverage: '50%', coverageUrl: 'https://s', tests: '1/2', testsUrl: 'https://s' };

  it('defaults to N/A', () => {
    expect(resolveCoverage(undefined, undefined, 'b')).toEqual({ coverage: 'N/A', coverageUrl: '#', results: 'N/A', resultsUrl: '#' });
  });

  it('prefers saucelabs, then sonarqube, and ignores unsafe urls', () => {
    const v = resolveCoverage(
      remote,
      { sonarqube: { coverage: 1 }, saucelabs: { coverage: '70', coverageUrl: 'javascript:alert(1)', results: 'x', resultsUrl: '/r.html' } },
      'https://api/builds/1/artifacts'
    );

    expect(v).toEqual({ coverage: '70%', coverageUrl: '#', results: '1/2', resultsUrl: 'https://api/builds/1/artifacts/r.html' });
  });
});
