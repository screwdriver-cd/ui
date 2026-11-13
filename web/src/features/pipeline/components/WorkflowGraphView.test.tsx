import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { getSession } from '~/auth/session';
import {
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '~/features/workflow-graph/fixtures/graphs';
import { mockReactFlowEnvironment } from '~/features/workflow-graph/render/testSetup';
import { clearLayoutCache } from '~/features/workflow-graph/layout/client';
import { mockFetch, signIn } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import type { Build, Job, Pipeline, SdEvent } from '../types';
import type { WorkflowNodeInfo } from '~/features/workflow-graph';
import {
  stageSetupJob,
  toGraphJobs,
  toggleTarget,
  WorkflowGraphView
} from './WorkflowGraphView';

const event = {
  id: 42,
  pipelineId: 1,
  groupEventId: 42,
  type: 'pipeline',
  sha: 'abcdef1234567890',
  startFrom: '~commit',
  createTime: '2020-01-01T00:00:00Z',
  creator: { username: 'batman' },
  commit: { message: 'Fix', author: { username: 'batman' } }
} as unknown as SdEvent;

const basePipeline = { id: 1, state: 'ACTIVE' } as Pipeline;
const node = (name: string) =>
  document.querySelector(`[data-node="${name}"]`) as HTMLElement;

async function renderView(
  props: Partial<Parameters<typeof WorkflowGraphView>[0]>
) {
  const root = createRootRoute({
    component: () => (
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraphView
          pipeline={basePipeline}
          event={event}
          mode="events"
          {...props}
        />
      </div>
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
}

describe('toGraphJobs', () => {
  it('derives isDisabled from state and keeps group', () => {
    const jobs = [
      { id: 1, name: 'a', state: 'DISABLED', group: 7 },
      { id: 2, name: 'b', state: 'ENABLED' }
    ] as Job[];

    expect(toGraphJobs(jobs)).toEqual([
      expect.objectContaining({ id: 1, isDisabled: true, group: 7 }),
      expect.objectContaining({ id: 2, isDisabled: false })
    ]);
    expect(toGraphJobs(undefined)).toBeUndefined();
  });

  it('names the stage setup job', () => {
    expect(stageSetupJob('integration').name).toBe('stage@integration:setup');
  });
});

describe('toggleTarget', () => {
  const info = (over: Partial<WorkflowNodeInfo> = {}) =>
    ({
      name: 'main',
      jobId: 50,
      canStart: true,
      canStop: false,
      canToggle: true,
      ...over
    } as WorkflowNodeInfo);

  it('toggles the job itself', () => {
    const jobs = [{ id: 50, name: 'main', state: 'ENABLED' }] as Job[];

    expect(toggleTarget(info(), jobs)).toBe(jobs[0]);
  });

  it("toggles a PR job's parent job (prParentJobId), and the job itself otherwise", () => {
    const jobs = [
      { id: 50, name: 'PR-7:main', state: 'ENABLED', prParentJobId: 5 },
      { id: 5, name: 'main', state: 'DISABLED' }
    ] as Job[];

    expect(toggleTarget(info(), jobs)).toBe(jobs[1]);
    expect(toggleTarget(info({ isDisabled: true }), [jobs[0] as Job])).toEqual(
      expect.objectContaining({ id: 5, state: 'DISABLED' })
    );
  });

  it('needs a job id', () => {
    expect(toggleTarget(info({ jobId: undefined }), [])).toBeUndefined();
  });
});

describe('<WorkflowGraphView />', () => {
  beforeEach(() => {
    mockReactFlowEnvironment();
    clearLayoutCache();
    signIn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('shows status of PR nodes that have no ids, using the PR job group', async () => {
    mockFetch([[/.*/, () => []]]);
    await renderView({
      mode: 'pulls',
      event: { ...event, type: 'pr', prNum: 7, startFrom: '~pr' } as SdEvent,
      graph: {
        nodes: [{ name: '~pr' }, { name: 'main' }],
        edges: [{ src: '~pr', dest: 'main' }]
      },
      jobs: [
        {
          id: 50,
          name: 'PR-7:main',
          pipelineId: 1,
          state: 'ENABLED',
          group: 7
        } as Job
      ],
      builds: [
        { id: 9, jobId: 50, status: 'FAILURE', createTime: 'x' } as Build
      ]
    });

    await waitFor(() => expect(node('main')).not.toBeNull());
    expect(within(node('main')).getByRole('img')).toHaveAccessibleName(
      'Failure'
    );
  });

  it('supplies stages and starts a stage through the start modal', async () => {
    mockFetch([
      [/\/pipelines\/1\/stages$/, () => STAGES],
      [
        /\/events\/42\/stageBuilds$/,
        () => [{ id: 3, stageId: 7, eventId: 42, status: 'SUCCESS' }]
      ],
      [
        /\/pipelines\/1\/jobs$/,
        () => STAGE_JOBS.map(j => ({ ...j, pipelineId: 1, state: 'ENABLED' }))
      ],
      [/.*/, () => ({})]
    ]);
    await renderView({
      graph: STAGES_GRAPH as never,
      jobs: STAGE_JOBS.map(
        j => ({ ...j, pipelineId: 1, state: 'ENABLED' } as Job)
      )
    });

    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );
    fireEvent.click(
      within(
        document.querySelector('[data-stage="integration"]') as HTMLElement
      ).getByRole('button', { name: 'Start stage' })
    );
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: 'integration' })
      ).getByRole('button', { name: 'New Run (Fresh)' })
    );
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'stage@integration:setup'
    );
  });

  it('restarts a stage from this event (RESTART_FROM_EVENT)', async () => {
    let posted: Record<string, unknown> | undefined;

    mockFetch([
      [/\/pipelines\/1\/stages$/, () => STAGES],
      [/\/events\/42\/stageBuilds$/, () => []],
      [
        /\/pipelines\/1\/jobs$/,
        () => STAGE_JOBS.map(j => ({ ...j, pipelineId: 1, state: 'ENABLED' }))
      ],
      [
        /^\/api\/v4\/events$|\/events$/,
        (_url, init) => {
          if (init?.method === 'POST') {
            posted = JSON.parse(String(init.body));

            return { ...event, id: 43 };
          }

          return [];
        }
      ],
      [/.*/, () => ({})]
    ]);
    await renderView({
      graph: STAGES_GRAPH as never,
      jobs: STAGE_JOBS.map(
        j => ({ ...j, pipelineId: 1, state: 'ENABLED' } as Job)
      )
    });
    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );
    fireEvent.click(
      within(
        document.querySelector('[data-stage="integration"]') as HTMLElement
      ).getByRole('button', { name: 'Start stage' })
    );
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: 'integration' })
      ).getByRole('button', { name: 'Restart (Inherit)' })
    );

    const confirm = await screen.findByRole('button', { name: 'Restart' });

    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() => expect(posted).toBeDefined());
    expect(posted).toEqual(
      expect.objectContaining({
        startFrom: 'stage@integration:setup',
        startAction: 'RESTART_FROM_EVENT',
        parentEventId: 42,
        groupEventId: 42
      })
    );
  });

  it('disables a job with a reason from the popover', async () => {
    let put: { path: string; body: unknown } | undefined;

    mockFetch([
      [
        /\/jobs\/1$/,
        (url, init) => {
          if (init?.method === 'PUT') {
            put = { path: url.pathname, body: JSON.parse(String(init.body)) };
          }

          return { id: 1 };
        }
      ],
      [/.*/, () => []]
    ]);
    await renderView({
      graph: {
        nodes: [{ name: '~commit' }, { name: 'main', id: 1 }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      jobs: [{ id: 1, name: 'main', pipelineId: 1, state: 'ENABLED' } as Job]
    });
    await waitFor(() => expect(node('main')).not.toBeNull());
    fireEvent.click(node('main'));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'main' })).getByRole(
        'button',
        { name: 'Disable this job' }
      )
    );

    const modal = within(await screen.findByRole('dialog'));

    expect(modal.getByText('Disable main?')).toBeInTheDocument();
    fireEvent.change(modal.getByRole('textbox'), {
      target: { value: 'flaky' }
    });
    fireEvent.click(modal.getByRole('button', { name: 'Disable' }));
    await waitFor(() => expect(put).toBeDefined());
    expect(put?.body).toEqual({
      state: 'DISABLED',
      stateChangeMessage: 'flaky'
    });
  });

  it('hides enable/disable when event actions are not allowed', async () => {
    mockFetch([[/.*/, () => []]]);
    await renderView({
      allowEventAction: false,
      graph: {
        nodes: [{ name: '~commit' }, { name: 'main', id: 1 }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      jobs: [{ id: 1, name: 'main', pipelineId: 1, state: 'ENABLED' } as Job]
    });
    await waitFor(() => expect(node('main')).not.toBeNull());
    fireEvent.click(node('main'));

    const dialog = within(await screen.findByRole('dialog', { name: 'main' }));

    expect(dialog.queryByRole('button', { name: /this job/ })).toBeNull();
    expect(
      dialog.getByRole('button', { name: 'Go to build metrics' })
    ).toBeInTheDocument();
  });

  it('opens remote pipelines in a new tab', async () => {
    const open = vi.fn();

    vi.stubGlobal('open', open);
    mockFetch([[/.*/, () => []]]);
    await renderView({
      graph: {
        nodes: [
          { name: '~commit' },
          { name: 'main', id: 1 },
          { name: 'sd@5:ext' },
          { name: 'after', id: 2 }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: 'main', dest: 'sd@5:ext' },
          { src: 'sd@5:ext', dest: 'after' }
        ]
      }
    });
    await waitFor(() => expect(node('sd@5:ext')).not.toBeNull());
    fireEvent.click(node('sd@5:ext'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Go to remote pipeline' })
    );
    expect(open).toHaveBeenCalledWith(
      '/v2/pipelines/5',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('loads downstream triggers only when showEventTriggers is on', async () => {
    const { calls } = mockFetch([
      [
        /\/pipelines\/1\/triggers$/,
        () => [{ jobName: 'main', triggers: ['~sd@9:a'] }]
      ],
      [/.*/, () => []]
    ]);
    const graph = {
      nodes: [{ name: '~commit' }, { name: 'main', id: 1 }],
      edges: [{ src: '~commit', dest: 'main' }]
    };

    await renderView({
      graph,
      pipeline: { ...basePipeline, settings: { showEventTriggers: true } }
    });
    await waitFor(() => expect(node('~sd-main-triggers')).not.toBeNull());
    expect(calls.some(c => c.path.endsWith('/pipelines/1/triggers'))).toBe(
      true
    );
  });

  it("hides PR-only jobs on an event when this pipeline's showPRJobs preference is off", async () => {
    mockFetch([
      [/\/users\/settings$/, () => ({ '1': { showPRJobs: false } })],
      [/.*/, () => []]
    ]);
    await renderView({
      graph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'main', id: 1 },
          { name: 'pronly', id: 2 }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: '~pr', dest: 'pronly' }
        ]
      }
    });
    await waitFor(() => expect(node('main')).not.toBeNull());
    await waitFor(() => expect(node('pronly')).toBeNull());
  });

  it('keeps PR-only jobs when only another pipeline has them hidden', async () => {
    mockFetch([
      [/\/users\/settings$/, () => ({ '2': { showPRJobs: false } })],
      [/.*/, () => []]
    ]);
    await renderView({
      graph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'main', id: 1 },
          { name: 'pronly', id: 2 }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: '~pr', dest: 'pronly' }
        ]
      }
    });
    await waitFor(() => expect(node('pronly')).not.toBeNull());
  });

  it('does not request triggers when the setting is off', async () => {
    const { calls } = mockFetch([[/.*/, () => []]]);

    await renderView({
      graph: {
        nodes: [{ name: '~commit' }, { name: 'main', id: 1 }],
        edges: [{ src: '~commit', dest: 'main' }]
      }
    });
    await waitFor(() => expect(node('main')).not.toBeNull());
    expect(calls.some(c => c.path.endsWith('/triggers'))).toBe(false);
  });
});
