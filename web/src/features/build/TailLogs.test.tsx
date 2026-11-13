import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { mockLayout } from '~/test/layout';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { LOG_CHUNK_LINES } from './api';
import { createRoutes } from './routes';

const TOTAL = 5000;
const at = '2020-01-01T10:00:00.000Z';
const build = {
  id: 100,
  jobId: 1,
  eventId: 5,
  sha: 'abc',
  status: 'SUCCESS',
  createTime: at,
  startTime: at,
  endTime: '2020-01-01T10:05:00.000Z',
  steps: [{ name: 'big', startTime: at, endTime: at, code: 0, lines: TOTAL }]
};

/** Serves lines [from, from + pages * 100) of a TOTAL line log. */
const serve = (url: URL) => {
  const from = Number(url.searchParams.get('from'));
  const pages = Number(url.searchParams.get('pages'));
  const out = [];

  for (let n = from; n < Math.min(TOTAL, from + pages * 100); n += 1) {
    out.push({ t: Date.parse(at) + n, m: `line ${n}`, n });
  }

  return out;
};

function setup() {
  return mockFetch([
    [/\/builds\/100\/steps\/big\/logs$/, serve],
    [/\/builds\/100$/, () => build],
    [/\/jobs\/1$/, () => ({ id: 1, name: 'main', pipelineId: 4 })],
    [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
    [/\/pipelines\/4$/, () => ({ id: 4, name: 'p', state: 'ACTIVE' })],
    [/\/users\/settings$/, () => ({})]
  ]);
}

const logCalls = (calls: Array<{ path: string; search: string }>) =>
  calls.filter(c => c.path.endsWith('/logs')).map(c => Object.fromEntries(new URLSearchParams(c.search)));

describe('tail-first step logs', () => {
  beforeEach(() => {
    mockLayout();
    signIn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('loads only the last chunk of a long finished step, then pages upward on demand', async () => {
    const { calls } = setup();

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/big');
    expect(await screen.findByText(`line ${TOTAL - LOG_CHUNK_LINES}`)).toBeInTheDocument();

    // One forward chunk starting at total - chunk, never from 0.
    expect(logCalls(calls)).toEqual([{ from: String(TOTAL - LOG_CHUNK_LINES), pages: '10', sort: 'ascending' }]);
    expect(screen.queryByText('line 0')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Load earlier lines' }));
    await waitFor(() => expect(logCalls(calls)).toHaveLength(2));
    expect(logCalls(calls)[1]).toEqual({ from: String(TOTAL - 2 * LOG_CHUNK_LINES), pages: '10', sort: 'ascending' });
    // Still more above, so the control stays.
    expect(await screen.findByRole('button', { name: 'Load earlier lines' })).toBeEnabled();
  });

  it('Top loads every earlier chunk without refetching any range, then hides the control', async () => {
    const { calls } = setup();

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/big');
    await screen.findByText(`line ${TOTAL - LOG_CHUNK_LINES}`);
    await userEvent.click(screen.getByRole('button', { name: 'Go to top' }));

    await waitFor(() => expect(screen.queryByTestId('log-earlier')).toBeNull());
    const froms = logCalls(calls).map(c => Number(c.from));

    expect(froms).toEqual([4000, 3000, 2000, 1000, 0]);
  });

  it('opens a short finished step from line 0 with no earlier control', async () => {
    const { calls } = mockFetch([
      [/\/builds\/100\/steps\/big\/logs$/, serve],
      [/\/builds\/100$/, () => ({ ...build, steps: [{ ...build.steps[0], lines: 150 }] })],
      [/\/jobs\/1$/, () => ({ id: 1, name: 'main', pipelineId: 4 })],
      [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
      [/\/pipelines\/4$/, () => ({ id: 4, name: 'p' })],
      [/\/users\/settings$/, () => ({})]
    ]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/big');
    expect(await screen.findByText('line 10')).toBeInTheDocument();
    expect(logCalls(calls)[0]).toMatchObject({ from: '0' });
    expect(screen.queryByTestId('log-earlier')).toBeNull();
  });

  it('opens a long running step at its tail after measuring where it ends', async () => {
    const { calls } = mockFetch([
      [/\/builds\/100\/steps\/big\/logs$/, serve],
      [/\/builds\/100$/, () => ({ ...build, status: 'RUNNING', endTime: undefined, steps: [{ name: 'big', startTime: at }] })],
      [/\/jobs\/1$/, () => ({ id: 1, name: 'main', pipelineId: 4 })],
      [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
      [/\/pipelines\/4$/, () => ({ id: 4, name: 'p', state: 'ACTIVE' })],
      [/\/users\/settings$/, () => ({})]
    ]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/big');
    expect(await screen.findByText(`line ${TOTAL - LOG_CHUNK_LINES}`)).toBeInTheDocument();

    const reads = logCalls(calls);
    const forward = reads.filter(c => c.pages !== '1');

    // Probes are single pages; the first real read starts one chunk before the end and nothing starts at 0.
    expect(forward[0]).toEqual({ from: String(TOTAL - LOG_CHUNK_LINES), pages: '10', sort: 'ascending' });
    expect(reads.every(c => Number(c.from) >= 2000)).toBe(true);
    expect(screen.queryByText('line 0')).toBeNull();
    expect(screen.getByRole('button', { name: 'Load earlier lines' })).toBeEnabled();
  });

  it('keeps reading a short running step from line 0', async () => {
    const { calls } = mockFetch([
      [/\/builds\/100\/steps\/big\/logs$/, (url: URL) => (Number(url.searchParams.get('from')) >= 150 ? [] : serve(url).slice(0, 150))],
      [/\/builds\/100$/, () => ({ ...build, status: 'RUNNING', endTime: undefined, steps: [{ name: 'big', startTime: at }] })],
      [/\/jobs\/1$/, () => ({ id: 1, name: 'main', pipelineId: 4 })],
      [/\/events\/5$/, () => ({ id: 5, sha: 'abc' })],
      [/\/pipelines\/4$/, () => ({ id: 4, name: 'p', state: 'ACTIVE' })],
      [/\/users\/settings$/, () => ({})]
    ]);

    await renderFeature(createRoutes, '/pipelines/4/builds/100/steps/big');
    expect(await screen.findByText('line 10')).toBeInTheDocument();
    expect(logCalls(calls).some(c => c.from === '0')).toBe(true);
    expect(screen.queryByTestId('log-earlier')).toBeNull();
  });
});
