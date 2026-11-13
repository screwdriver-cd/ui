import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { getSession } from '~/auth/session';
import { clearLayoutCache } from '~/features/workflow-graph/layout/client';
import { mockReactFlowEnvironment } from '~/features/workflow-graph/render/testSetup';
import { mockFetch, signIn } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import { StartWarningAlert } from '../hooks/useStartGuard';
import type { Pipeline, SdEvent } from '../types';
import { WorkflowView } from './WorkflowView';

const prEvent = {
  id: 42,
  pipelineId: 1,
  groupEventId: 42,
  type: 'pr',
  prNum: 7,
  sha: 'abcdef1234567890',
  startFrom: '~pr',
  createTime: '2020-01-01T00:00:00Z',
  creator: { username: 'batman' },
  commit: { message: 'Fix', author: { username: 'batman' } },
  workflowGraph: {
    nodes: [{ name: '~pr' }, { name: 'main' }, { name: 'lint' }],
    edges: [
      { src: '~pr', dest: 'main' },
      { src: '~pr', dest: 'lint' }
    ]
  }
} as unknown as SdEvent;

async function renderWorkflow(event: SdEvent, mode: 'events' | 'pulls', pipeline: Partial<Pipeline> = {}) {
  const root = createRootRoute({
    component: () => (
      <div style={{ width: 1000, height: 600 }}>
        <StartWarningAlert pipelineId={1} />
        <WorkflowView pipeline={{ id: 1, state: 'ACTIVE', ...pipeline } as Pipeline} event={event} mode={mode} />
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

const node = (name: string) =>
  document.querySelector(`[data-node="${name}"]`) as HTMLElement;

describe('WorkflowView (pull requests)', () => {
  beforeEach(() => {
    mockReactFlowEnvironment();
    clearLayoutCache();
    signIn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it("gives the graph this PR's jobs with their PR number plus the parent pipeline jobs", async () => {
    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        url =>
          url.searchParams.get('type') === 'pr'
            ? [
                { id: 50, name: 'PR-7:main', pipelineId: 1, state: 'ENABLED', prParentJobId: 10 },
                { id: 51, name: 'PR-7:lint', pipelineId: 1, state: 'ENABLED', prParentJobId: 11 },
                { id: 60, name: 'PR-8:main', pipelineId: 1, state: 'ENABLED', prParentJobId: 10 }
              ]
            : [
                { id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' },
                { id: 11, name: 'lint', pipelineId: 1, state: 'DISABLED' }
              ]
      ],
      [/\/events\/42\/builds$/, () => [{ id: 9, jobId: 50, status: 'FAILURE', createTime: 'x' }]],
      [/\/events\/42$/, () => prEvent],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(prEvent, 'pulls');

    // PR-7:main is found by name through its PR number (`group`) and shows its build.
    await waitFor(() =>
      expect(within(node('main')).getByRole('img')).toHaveAccessibleName('Failure')
    );
    // PR-7:lint takes its state from the disabled parent pipeline job.
    expect(within(node('lint')).getByRole('img')).toHaveAccessibleName('Disabled');
    expect(screen.queryByText('PR-8:main')).toBeNull();
  });

  it('shows the archived jobs of a closed PR with their builds', async () => {
    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        url =>
          url.searchParams.get('type') !== 'pr'
            ? [{ id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' }]
            : url.searchParams.get('archived') === 'true'
              ? [{ id: 50, name: 'PR-7:main', pipelineId: 1, state: 'ENABLED', archived: true, prParentJobId: 10 }]
              : [{ id: 60, name: 'PR-8:main', pipelineId: 1, state: 'ENABLED', prParentJobId: 10 }]
      ],
      [/\/events\/42\/builds$/, () => [{ id: 9, jobId: 50, status: 'FAILURE', createTime: 'x' }]],
      [/\/events\/42$/, () => prEvent],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(prEvent, 'pulls');

    await waitFor(() =>
      expect(within(node('main')).getByRole('img')).toHaveAccessibleName('Failure')
    );
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    const row = (await screen.findByText('main')).closest('tr') as HTMLElement;

    expect(within(row).getByRole('link', { name: /FAILURE/ })).toBeInTheDocument();
  });

  it('keeps the build of a job a later commit removed from the PR', async () => {
    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        url =>
          url.searchParams.get('type') !== 'pr'
            ? [
                { id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' },
                { id: 11, name: 'lint', pipelineId: 1, state: 'ENABLED' }
              ]
            : url.searchParams.get('archived') === 'true'
              ? [{ id: 51, name: 'PR-7:lint', pipelineId: 1, state: 'ENABLED', archived: true, prParentJobId: 11 }]
              : [{ id: 50, name: 'PR-7:main', pipelineId: 1, state: 'ENABLED', prParentJobId: 10 }]
      ],
      [
        /\/events\/42\/builds$/,
        () => [
          { id: 8, jobId: 50, status: 'SUCCESS', createTime: 'x' },
          { id: 9, jobId: 51, status: 'FAILURE', createTime: 'x' }
        ]
      ],
      [/\/events\/42$/, () => prEvent],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(prEvent, 'pulls');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const row = (await screen.findByText('lint')).closest('tr') as HTMLElement;

    expect(within(row).getByRole('link', { name: /FAILURE/ })).toBeInTheDocument();
    expect(within(row).getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('reports a failed jobs read with a retry instead of an empty table', async () => {
    let fail = true;

    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        url =>
          url.searchParams.get('type') === 'pr'
            ? fail
              ? 500
              : [{ id: 50, name: 'PR-7:main', pipelineId: 1, state: 'ENABLED', prParentJobId: 10 }]
            : [{ id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' }]
      ],
      [/\/events\/42\/builds$/, () => []],
      [/\/events\/42$/, () => prEvent],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(prEvent, 'pulls');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const alert = await screen.findByText('Something went wrong.');

    fail = false;
    await userEvent.click(within(alert.closest('[role="alert"]') as HTMLElement).getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByText('Something went wrong.')).toBeNull());
    expect((await screen.findByText('main')).closest('tr')).not.toBeNull();
  });

  it('enables a PR job in the table through its parent pipeline job', async () => {
    const puts: string[] = [];

    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        url =>
          url.searchParams.get('type') === 'pr'
            ? [{ id: 51, name: 'PR-7:lint', pipelineId: 1, state: 'ENABLED', prParentJobId: 11 }]
            : [{ id: 11, name: 'lint', pipelineId: 1, state: 'DISABLED' }]
      ],
      [/\/jobs\/\d+$/, url => (puts.push(url.pathname), {})],
      [/\/events\/42\/builds$/, () => []],
      [/\/events\/42$/, () => prEvent],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(prEvent, 'pulls');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    // The row shows the parent's state, so the action offered is "Enable".
    await userEvent.click(await screen.findByRole('button', { name: 'Enable lint' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(puts).toEqual(['/v4/jobs/11']));
  });
});

describe('WorkflowView (table)', () => {
  beforeEach(() => {
    mockReactFlowEnvironment();
    clearLayoutCache();
    signIn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('starts a job from the event the table shows, not from the latest commit', async () => {
    const event = {
      ...prEvent,
      type: 'pipeline',
      prNum: undefined,
      startFrom: '~commit',
      groupEventId: 40,
      workflowGraph: { nodes: [{ name: '~commit' }, { name: 'main', id: 10 }], edges: [{ src: '~commit', dest: 'main' }] }
    } as unknown as SdEvent;
    const posted: unknown[] = [];

    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => [{ id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' }]],
      [/\/events\/42\/builds$/, () => []],
      [/\/events\/42$/, () => event],
      [/\/pipelines\/1\/latestCommitEvent$/, () => ({ ...event, id: 99, sha: 'ffff' })],
      [/\/events$/, (_u, init) => (posted.push(JSON.parse(String(init?.body))), { ...event, id: 100 })],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(event, 'events');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Start a new event from main' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Start' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      startFrom: 'main',
      startAction: 'START_FROM_EVENT',
      parentEventId: 42,
      groupEventId: 40
    });
  });

  it('restarts the event the dialog was opened on after Back selects another one', async () => {
    const eventA = {
      ...prEvent,
      type: 'pipeline',
      prNum: undefined,
      startFrom: '~commit',
      workflowGraph: { nodes: [{ name: '~commit' }, { name: 'main', id: 10 }], edges: [{ src: '~commit', dest: 'main' }] }
    } as unknown as SdEvent;
    const eventB = { ...eventA, id: 43, groupEventId: 43, sha: 'bbbbbbbbbbbb' } as SdEvent;
    const posted: Array<{ parentEventId?: number }> = [];

    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => [{ id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' }]],
      [/\/events\/4[23]\/builds$/, () => []],
      [/\/events\/42$/, () => eventA],
      [/\/events\/43$/, () => eventB],
      [/\/events$/, (_u, init) => (posted.push(JSON.parse(String(init?.body))), { ...eventA, id: 100 })],
      [/.*/, () => ({})]
    ]);
    function Switching() {
      const [event, setEvent] = useState(eventA);

      return (
        <div style={{ width: 1000, height: 600 }}>
          <button type="button" onClick={() => setEvent(eventB)}>
            back
          </button>
          <WorkflowView pipeline={{ id: 1, state: 'ACTIVE' } as Pipeline} event={event} mode="events" />
        </div>
      );
    }
    const router = createRouter({
      routeTree: createRootRoute({ component: Switching }),
      history: createMemoryHistory({ initialEntries: ['/'] })
    });

    renderWithProviders(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Restart event' }));
    const dialog = await screen.findByRole('dialog');

    // Back to another event while the dialog is open (the dialog's backdrop is not in the way of history).
    await act(async () => screen.getByRole('button', { name: 'back', hidden: true }).click());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Restart' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]?.parentEventId).toBe(42);
  });

  it("lists the event's own jobs: removed ones keep their build, new ones are left out", async () => {
    const event = {
      ...prEvent,
      type: 'pipeline',
      prNum: undefined,
      startFrom: '~commit',
      workflowGraph: {
        nodes: [
          { name: '~commit' },
          { name: 'main', id: 10 },
          { name: 'gone', id: 12 },
          { name: 'gone-virtual', id: 14, virtual: true }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: 'main', dest: 'gone' },
          { src: 'main', dest: 'gone-virtual' }
        ]
      }
    } as unknown as SdEvent;

    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        () => [
          { id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' },
          { id: 13, name: 'added-later', pipelineId: 1, state: 'ENABLED' }
        ]
      ],
      [/\/events\/42\/builds$/, () => [{ id: 9, jobId: 12, status: 'FAILURE', createTime: 'x' }]],
      [/\/events\/42$/, () => event],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(event, 'events');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const row = (await screen.findByText('gone')).closest('tr') as HTMLElement;

    await waitFor(() => expect(within(row).getByRole('link', { name: /FAILURE/ })).toBeInTheDocument());
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.queryByText('added-later')).toBeNull();
    // A removed job is archived: the API would not start it, and there is no job left to disable.
    expect(within(row).getByText('Archived')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^Start/ })).toBeDisabled();
    expect(within(row).queryByRole('button', { name: 'Disable gone' })).toBeNull();
    // Its graph node still marks a virtual job, which the table leaves out like a current one.
    expect(screen.queryByText('gone-virtual')).toBeNull();
  });
});

describe('WorkflowView (SCM account)', () => {
  beforeEach(() => {
    mockReactFlowEnvironment();
    clearLayoutCache();
    getSession().set({ username: 'batman', scope: ['user'], scmContext: 'github:github.com', isGuest: false, token: 'x' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('does not link a CREATED build that is still waiting for its upstream jobs', async () => {
    const event = {
      ...prEvent,
      type: 'pipeline',
      prNum: undefined,
      startFrom: '~commit',
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main', id: 10 }, { name: 'lint', id: 11 }],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: 'main', dest: 'lint' }
        ]
      }
    } as unknown as SdEvent;

    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        () => [
          { id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' },
          { id: 11, name: 'lint', pipelineId: 1, state: 'ENABLED' }
        ]
      ],
      [
        /\/events\/42\/builds$/,
        () => [
          { id: 8, jobId: 10, status: 'RUNNING', createTime: 'x' },
          { id: 9, jobId: 11, status: 'CREATED', createTime: 'x' }
        ]
      ],
      [/\/events\/42$/, () => event],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(event, 'events');
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const main = (await screen.findByText('main')).closest('tr') as HTMLElement;

    await waitFor(() => expect(within(main).getByRole('link', { name: /RUNNING/ })).toBeInTheDocument());
    const lint = screen.getByText('lint').closest('tr') as HTMLElement;

    expect(within(lint).getByText(/CREATED/)).toBeInTheDocument();
    expect(within(lint).queryByRole('link', { name: /CREATED/ })).toBeNull();
  });

  it('warns instead of opening a start dialog when the pipeline is on another SCM', async () => {
    const event = {
      ...prEvent,
      type: 'pipeline',
      prNum: undefined,
      startFrom: '~commit',
      workflowGraph: { nodes: [{ name: '~commit' }, { name: 'main', id: 10 }], edges: [{ src: '~commit', dest: 'main' }] }
    } as unknown as SdEvent;

    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => [{ id: 10, name: 'main', pipelineId: 1, state: 'ENABLED' }]],
      [/\/auth\/contexts$/, () => [{ context: 'github:target.example', displayName: 'Target' }]],
      [/\/events\/42\/builds$/, () => []],
      [/\/events\/42$/, () => event],
      [/.*/, () => ({})]
    ]);
    await renderWorkflow(event, 'events', { scmContext: 'github:target.example' });

    await userEvent.click(screen.getByRole('button', { name: 'Restart event' }));
    expect(await screen.findByText(/sign in to Target/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Close alert' }));
    expect(screen.queryByText(/sign in to Target/)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Start a new event from main' }));
    expect(await screen.findByText(/sign in to Target/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
