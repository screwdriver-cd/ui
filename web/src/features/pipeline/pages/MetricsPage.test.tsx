import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { normalizeMetrics } from '../api/queries';
import { createRoutes } from '../routes';
import { parseJobId } from './MetricsPage';

const pipeline = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE',
  settings: { metricsDowntimeJobs: [7] }
};

const events = [
  {
    id: 101,
    createTime: '2024-03-13T09:00:00.000Z',
    sha: 'aaaaaaa111',
    status: 'SUCCESS',
    duration: 120,
    queuedTime: 60,
    imagePullTime: 30,
    builds: [{ id: 501, jobId: 7, duration: 60, status: 'SUCCESS' }]
  },
  {
    id: 102,
    createTime: '2024-03-14T09:00:00.000Z',
    sha: 'bbbbbbb222',
    status: 'FAILURE',
    duration: 240,
    queuedTime: 0,
    imagePullTime: 90,
    builds: [{ id: 502, jobId: 7, duration: 240, status: 'FAILURE' }]
  }
];

const jobMetrics = [
  {
    id: 501,
    createTime: '2024-03-13T09:00:00.000Z',
    sha: 'aaaaaaa111',
    status: 'SUCCESS',
    duration: 60,
    steps: [
      { name: 'install', duration: 30 },
      { name: 'test', duration: 30 }
    ]
  }
];

function setup(overrides: Array<[RegExp, (url: URL) => unknown]> = []) {
  return mockFetch([
    ...overrides,
    [/\/jobs\/7\/metrics/, () => jobMetrics],
    [/\/pipelines\/1\/metrics/, () => events],
    [/\/pipelines\/1\/jobs/, () => [{ id: 7, name: 'main', pipelineId: 1 }]],
    [/\/pipelines\/1$/, () => pipeline],
    [/\/users\/settings$/, () => ({})]
  ]);
}

/** The value (`dd`) paired with the summary term (`dt`) labelled `label`. */
function stat(label: string) {
  return screen.getByRole('definition', { name: label });
}

/** The plotted chart (`role="img"`) inside the panel of the same name. */
const chart = (name: string) => within(screen.getByRole('region', { name })).getByRole('img', { name });

/** One column group per plotted event in the Events chart; SVG groups have no role. */
const columns = () => chart('Events').querySelectorAll('g[data-event]');

describe('normalizeMetrics', () => {
  it('defaults missing times to zero', () => {
    const m = normalizeMetrics([{ id: 1, status: 'SUCCESS', createTime: 'x', duration: 5 } as never])[0]!;

    expect(m.queuedTime).toBe(0);
    expect(m.imagePullTime).toBe(0);
    expect(m.duration).toBe(5);
    expect(normalizeMetrics(undefined)).toEqual([]);
  });
});

describe('parseJobId', () => {
  it('accepts numbers and numeric strings only', () => {
    expect(parseJobId(7)).toBe(7);
    expect(parseJobId('7')).toBe(7);
    expect(parseJobId('x')).toBeNull();
    expect(parseJobId(undefined)).toBeNull();
    expect(parseJobId(-1)).toBeNull();
  });
});

describe('metrics page', () => {
  beforeEach(() => signIn());

  it('renders the summary, including passed/failed and image pull time', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');

    await screen.findByText('Passed / Failed Jobs');
    await waitFor(() => expect(stat('Passed / Failed Jobs')).toHaveTextContent(/^1 \/ 1$/));

    // Passed and failed counts are coloured by class; there is no ARIA equivalent.
    const [passed, failed] = within(stat('Passed / Failed Jobs')).getAllByText('1');

    expect(passed).toHaveClass('passed');
    expect(failed).toHaveClass('failed');
    expect(stat('Avg. Image Pull Time')).toHaveTextContent(/^1m$/);
    expect(stat('Total Events')).toHaveTextContent(/^2$/);
  });

  it('draws every chart with one column per event', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');

    await waitFor(() => expect(columns()).toHaveLength(2));
    for (const name of ['Downtime', 'Build Count', 'Events', 'Build Breakdown Per Event']) {
      expect(within(screen.getByRole('region', { name })).getByRole('img', { name })).toBeInTheDocument();
    }
    for (const r of Array.from(document.querySelectorAll('svg path'))) {
      expect(r.getAttribute('d')).not.toContain('NaN');
    }
    // A failed event's duration uses the critical status color (bars have no role; fill is the visual under test).
    const failed = chart('Events').querySelector('g[data-event="102"] [data-series="duration"]');

    expect(failed).toHaveAttribute('fill', '#d03b3b');
  });

  it('asks for downtime of every job, counting FAILURE builds', async () => {
    const { calls } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await waitFor(() =>
      expect(calls.some(c => c.search.includes('downtimeJobs%5B%5D=7') && c.search.includes('downtimeStatuses%5B%5D=FAILURE'))).toBe(true)
    );
  });

  it('changes the window with presets and a custom date range', async () => {
    const { calls } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await screen.findByRole('button', { name: '1wk', pressed: true });

    const before = calls.length;

    await userEvent.click(screen.getByRole('button', { name: '6hr' }));
    expect(screen.getByRole('button', { name: '6hr', pressed: true })).toBeInTheDocument();
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2024-03-01' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2024-03-05' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const start = encodeURIComponent(new Date(2024, 2, 1).toISOString());

    await waitFor(() => expect(calls.some(c => c.search.includes(start))).toBe(true));
    expect(screen.queryByRole('button', { pressed: true, name: '6hr' })).toBeNull();
  });

  it('disables Apply for a reversed custom range', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2024-03-09' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2024-03-05' } });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('filters to successful events with Success Only', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await waitFor(() => expect(columns()).toHaveLength(2));
    await userEvent.click(screen.getByLabelText('Success Only'));
    expect(columns()).toHaveLength(1);
  });

  it('switches the time axis label between Local and UTC', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await waitFor(() => expect(screen.getAllByText('Local date time').length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole('button', { name: 'UTC' }));
    expect(screen.getByRole('button', { name: 'UTC', pressed: true })).toBeInTheDocument();
    expect(screen.queryAllByText('Local date time')).toHaveLength(0);
    expect(screen.getAllByText('UTC date time').length).toBeGreaterThan(0);
  });

  it('shows a trendline instead of stacked bars', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');

    const events = await screen.findByRole('region', { name: 'Events' });

    await waitFor(() => expect(chart('Events').querySelectorAll('path[data-series]').length).toBeGreaterThan(0));
    await userEvent.click(within(events).getByLabelText('Trendline View'));
    expect(chart('Events').querySelectorAll('path[data-series]')).toHaveLength(0);
    expect(chart('Events').querySelector('polyline')).not.toBeNull();
  });

  it('toggles legend series and keeps at least one visible', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');

    const events = await screen.findByRole('region', { name: 'Events' });
    const queued = await within(events).findByRole('button', { name: 'Queued', pressed: true });

    await userEvent.click(queued);
    expect(within(events).getByRole('button', { name: 'Queued', pressed: false })).toBeInTheDocument();
    expect(chart('Events').querySelectorAll('[data-series="queuedTime"]')).toHaveLength(0);

    await userEvent.click(within(events).getByRole('button', { name: 'Show only Duration' }));
    expect(within(events).getByRole('button', { name: 'Image Pull', pressed: false })).toBeInTheDocument();
    // The last visible series cannot be hidden.
    await userEvent.click(within(events).getByRole('button', { name: 'Duration' }));
    expect(within(events).getByRole('button', { name: 'Duration', pressed: true })).toBeInTheDocument();
  });

  it('offers a table view that links to the event', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await userEvent.click(await screen.findByRole('button', { name: 'Show Events as a table' }));

    const events = screen.getByRole('region', { name: 'Events' });
    const links = within(events).getAllByRole('link');

    expect(links[0]).toHaveAttribute('href', '/v2/pipelines/1/events/101');
  });

  it('links build breakdown cells to their builds', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    await userEvent.click(await screen.findByRole('button', { name: 'Show Build Breakdown Per Event as a table' }));

    const builds = screen.getByRole('region', { name: 'Build Breakdown Per Event' });

    await waitFor(() => expect(within(builds).getByRole('link', { name: '1m' })).toHaveAttribute('href', '/pipelines/1/builds/501'));
  });

  it('navigates to the event when a column is clicked', async () => {
    setup();
    const { router } = await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    const overlay = await screen.findByTestId('metrics-events-overlay');

    // jsdom boxes are at 0,0; the default chart is 640 wide, so x=500 is the second column.
    fireEvent.click(overlay, { clientX: 500, clientY: 100 });
    await waitFor(() => expect(router.state.location.pathname).toBe('/v2/pipelines/1/events/102'));
  });

  it('prompts for a job, then honours ?jobId= for the step breakdown', async () => {
    setup();
    const { router } = await renderFeature(createRoutes, '/v2/pipelines/1/metrics');

    expect(await screen.findByText(/Please select a job below/)).toBeInTheDocument();
    await screen.findByRole('option', { name: 'main' });
    await userEvent.selectOptions(screen.getByLabelText('Job'), '7');
    await waitFor(() => expect(router.state.location.search).toMatchObject({ jobId: 7 }));

    const steps = await screen.findByRole('region', { name: 'Step Breakdown Per Build' });

    expect(within(steps).getByRole('button', { name: 'install', pressed: true })).toBeInTheDocument();
    expect(within(steps).getByRole('button', { name: 'test', pressed: true })).toBeInTheDocument();
  });

  it('opens the step breakdown from a ?jobId= link and links steps', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics?jobId=7');

    const steps = await screen.findByRole('region', { name: 'Step Breakdown Per Build' });

    await userEvent.click(within(steps).getByRole('button', { name: 'Show Step Breakdown Per Build as a table' }));
    expect(within(steps).getAllByRole('link').map(a => a.getAttribute('href'))).toEqual([
      '/pipelines/1/builds/501',
      '/pipelines/1/builds/501/steps/install',
      '/pipelines/1/builds/501/steps/test'
    ]);
  });

  it('honours the ?jobId= of a PR job', async () => {
    const { calls } = setup([
      [/\/jobs\/8\/metrics/, () => jobMetrics],
      [
        /\/pipelines\/1\/jobs/,
        url =>
          url.searchParams.get('type') === 'pipeline'
            ? [{ id: 7, name: 'main', pipelineId: 1 }]
            : [
                { id: 7, name: 'main', pipelineId: 1 },
                { id: 8, name: 'PR-3:main', pipelineId: 1, prParentJobId: 7 }
              ]
      ]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics?jobId=8');

    await screen.findByRole('region', { name: 'Step Breakdown Per Build' });
    await waitFor(() => expect(calls.some(c => c.path === '/v4/jobs/8/metrics')).toBe(true));
  });

  it('ignores a jobId that is not one of the pipeline jobs', async () => {
    const { calls } = setup();
    const { queryClient } = await renderFeature(createRoutes, '/v2/pipelines/1/metrics?jobId=99');

    expect(await screen.findByText(/Please select a job below/)).toBeInTheDocument();
    // Once the job list has loaded, a known jobId would have started its metrics request.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(calls.some(c => c.path.includes('/jobs/'))).toBe(false);
    expect(screen.getByText(/Please select a job below/)).toBeInTheDocument();
  });

  it('shows the API error message, e.g. the 180 day limit', async () => {
    setup([
      [
        /\/pipelines\/1\/metrics/,
        () => new Response(JSON.stringify({ message: 'Time range is longer than 180 days' }), { status: 400 })
      ]
    ]);
    await renderFeature(createRoutes, '/v2/pipelines/1/metrics');
    expect(await screen.findByText('Time range is longer than 180 days')).toBeInTheDocument();
  });
});
