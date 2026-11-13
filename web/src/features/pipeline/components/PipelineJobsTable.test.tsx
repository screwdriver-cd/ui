import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import { useState } from 'react';
import type { Build, Job, Pipeline } from '../types';
import {
  buildJobRows,
  PipelineJobsTable
} from './PipelineJobsTable';

const job = (id: number, name: string, extra: Partial<Job> = {}): Job =>
  ({
    id,
    name,
    pipelineId: 1,
    state: 'ENABLED',
    permutations: [{ annotations: {} }],
    ...extra
  } as Job);
const pipeline = {
  id: 1,
  name: 'p',
  state: 'ACTIVE',
  workflowGraph: {
    nodes: [{ name: '~commit' }, { name: 'main' }, { name: 'test' }],
    edges: [
      { src: '~commit', dest: 'main' },
      { src: 'main', dest: 'test' }
    ]
  }
} as unknown as Pipeline;
const jobs = [
  job(1, 'main'),
  job(2, 'test', { permutations: [{ stage: { name: 'qa' } }] })
];

afterEach(() => vi.unstubAllGlobals());

async function renderTable(
  event?: Parameters<typeof PipelineJobsTable>[0]['event']
) {
  const { calls } = mockFetch([
    [
      /\/builds\/statuses$/,
      () => [
        {
          jobId: 1,
          builds: [
            { id: 11, jobId: 1, status: 'FAILURE' },
            {
              id: 12,
              jobId: 1,
              status: 'SUCCESS',
              startTime: '2026-09-22T05:20:00.000Z',
              endTime: '2026-09-22T05:22:01.000Z'
            }
          ]
        }
      ]
    ]
  ]);
  const onStart = vi.fn();
  const root = createRootRoute({
    component: () => (
      <PipelineJobsTable
        pipeline={pipeline}
        rows={buildJobRows(jobs)}
        onStart={onStart}
        onStop={vi.fn()}
        onToggleState={vi.fn()}
        archivedToggle={null}
        event={event}
      />
    )
  });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] })
  });

  renderWithProviders(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });

  return { calls, onStart };
}

describe('<PipelineJobsTable />', () => {
  it('shows history, duration, summary and fetches builds for the page rows only', async () => {
    const { calls } = await renderTable();
    const row = await screen.findByText('main');

    expect(row).toBeInTheDocument();
    expect(await screen.findByText('2m 1s')).toBeInTheDocument();
    expect(screen.getByText('Show 1 - 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Build #1[12]/ })).toHaveLength(
      2
    );
    const statuses = calls.find(c => c.path.endsWith('/builds/statuses'));

    expect(statuses?.search).toBe('?jobIds=1&jobIds=2&numBuilds=5');
  });

  it('still fetches builds when the rows shrink under a later page', async () => {
    const many = Array.from({ length: 21 }, (_, i) => job(i + 1, `job${i + 1}`));
    mockFetch([
      [
        /\/builds\/statuses$/,
        url =>
          url.searchParams.getAll('jobIds').includes('1')
            ? [{ jobId: 1, builds: [{ id: 11, jobId: 1, status: 'RUNNING' }] }]
            : []
      ]
    ]);
    function Shrinking() {
      const [all, setAll] = useState(true);

      return (
        <>
          <button type="button" onClick={() => setAll(false)}>
            hide
          </button>
          <PipelineJobsTable
            pipeline={pipeline}
            rows={buildJobRows(all ? many : many.slice(0, 10))}
            onStart={vi.fn()}
            onStop={vi.fn()}
            onToggleState={vi.fn()}
            archivedToggle={null}
          />
        </>
      );
    }
    const router = createRouter({
      routeTree: createRootRoute({ component: Shrinking }),
      history: createMemoryHistory({ initialEntries: ['/'] })
    });

    renderWithProviders(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Last page' }));
    await userEvent.click(screen.getByRole('button', { name: 'hide' }));

    // Back on page 1, with its build history (from the first fetch) still shown.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Build #11/ })).toBeInTheDocument()
    );
  });

  it('filters by job name and disables stop without a running build', async () => {
    await renderTable();
    await screen.findByText('2m 1s');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Filter by Job' }),
      'tes'
    );
    expect(screen.queryByText('main')).toBeNull();
    const rowEl = screen.getByText('test').closest('tr') as HTMLElement;

    expect(
      within(rowEl).getByRole('button', { name: /Stop the latest build/ })
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear Job filter' })
    );
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('starts a job from the actions column', async () => {
    const { onStart } = await renderTable();
    const rowEl = (await screen.findByText('main')).closest(
      'tr'
    ) as HTMLElement;

    await userEvent.click(
      within(rowEl).getByRole('button', { name: /Start a new event from main/ })
    );
    expect(onStart).toHaveBeenCalledWith(
      jobs[0],
      'start',
      expect.objectContaining({ id: 12 })
    );
  });

  it("shows one event's builds with a status filter instead of history", async () => {
    const { calls } = await renderTable({
      view: 'events',
      builds: [
        { id: 31, jobId: 1, status: 'SUCCESS' },
        { id: 32, jobId: 2, status: 'FAILURE' }
      ] as Build[]
    });

    expect(await screen.findByText('main')).toBeInTheDocument();
    expect(screen.queryByText('History')).toBeNull();
    expect(screen.getByRole('link', { name: /FAILURE/ })).toHaveAttribute(
      'href',
      '/v2/pipelines/1/builds/32'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by Status' }),
      'FAILURE'
    );
    expect(screen.queryByText('main')).toBeNull();
    expect(screen.getByText('test')).toBeInTheDocument();
    // the event already has its builds
    expect(calls.some(c => c.path.endsWith('/builds/statuses'))).toBe(false);
  });

  it('marks the sorted column with aria-sort', async () => {
    await renderTable();
    await userEvent.click(screen.getByRole('button', { name: /Job/ }));
    expect(screen.getByRole('columnheader', { name: /Job/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
  });
});
