import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '~/test/render';
import { clearLayoutCache } from '../layout/client';
import {
  JOIN_GRAPH,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import type { BuildLite } from '../types';
import { WorkflowGraph } from './WorkflowGraph';
import type { WorkflowGraphProps } from './types';
import { mockReactFlowEnvironment } from './testSetup';

// user-event pointer sequences trip d3-zoom in jsdom; plain click events are enough here.
const fastUser = () => ({
  click: async (el: Element) => {
    fireEvent.click(el);
  }
});

beforeEach(() => mockReactFlowEnvironment());
beforeEach(() => clearLayoutCache());

const b = (
  id: number,
  jobId: number,
  status: string,
  parentBuildId?: BuildLite['parentBuildId']
): BuildLite => ({
  id,
  jobId,
  status,
  parentBuildId
});

// job ids: build=1 t1=2 t2=3 t3=4 deploy=5 notify=6
const builds = [
  b(1, 1, 'SUCCESS'),
  b(2, 2, 'SUCCESS', 1),
  b(3, 3, 'RUNNING', 1),
  b(4, 4, 'FAILURE', 1)
];

async function setup(props: Partial<WorkflowGraphProps> = {}) {
  const utils = renderWithProviders(
    <div style={{ width: 1000, height: 600 }}>
      <WorkflowGraph
        graph={JOIN_GRAPH}
        builds={builds}
        start="~commit"
        {...props}
      />
    </div>
  );

  await waitFor(() =>
    expect(document.querySelector('[data-node="build"]')).not.toBeNull()
  );

  return utils;
}

const EXTERNAL = {
  nodes: [
    { name: '~commit' },
    { name: 'build', id: 1 },
    { name: 'sd@5:ext' },
    { name: 'after', id: 2 },
    { name: 'sd@6:leaf' }
  ],
  edges: [
    { src: '~commit', dest: 'build' },
    { src: 'build', dest: 'sd@5:ext' },
    { src: 'sd@5:ext', dest: 'after' },
    { src: 'build', dest: 'sd@6:leaf' }
  ]
};

const node = (name: string) =>
  document.querySelector(`[data-node="${name}"]`) as HTMLElement;

describe('<WorkflowGraph />', () => {
  it('renders job nodes with status icons and labels', async () => {
    await setup();

    expect(node('build')).toHaveTextContent('build');
    expect(within(node('t3')).getByRole('img')).toHaveAccessibleName('Failure');
    expect(within(node('t2')).getByRole('img')).toHaveAccessibleName('Running');
    expect(within(node('~commit')).getByRole('img')).toHaveAccessibleName(
      'Started from here'
    );
  });

  it('renders AND and OR join badges with satisfied inputs', async () => {
    await setup();

    expect(within(node('deploy')).getByTestId('join-and')).toHaveTextContent(
      'AND 1/3'
    );
    expect(within(node('notify')).getByTestId('join-or')).toHaveTextContent(
      'OR'
    );
    expect(node('build').querySelector('[data-testid^="join-"]')).toBeNull();
  });

  it('shows external pipeline nodes (leaf external jobs are filtered out)', async () => {
    await setup({ graph: EXTERNAL });

    expect(node('sd@5:ext')).toHaveAttribute('title', 'External pipeline 5');
    expect(node('sd@6:leaf')).toBeNull();
  });

  it('highlights the lens on hover and dims everything else', async () => {
    await setup();
    fireEvent.mouseEnter(node('t1'));

    await waitFor(() => expect(node('t3')).toHaveClass('wg-dim'));
    expect(node('t1')).toHaveClass('wg-tier--focus');
    expect(node('build')).toHaveClass('wg-tier--upstream-taken');
    expect(node('deploy')).toHaveClass('wg-tier--downstream');
    expect(node('t2')).toHaveClass('wg-dim');

    fireEvent.mouseLeave(node('t1'));
    await waitFor(() => expect(node('t3')).not.toHaveClass('wg-dim'));
  });

  it('keeps the lens pinned on click and unpins with the button', async () => {
    const user = fastUser();

    await setup();
    fireEvent.click(node('t1'));

    expect(await screen.findByText('Following t1')).toBeInTheDocument();
    fireEvent.mouseLeave(node('t1'));
    expect(node('t3')).toHaveClass('wg-dim');

    await user.click(screen.getByRole('button', { name: 'Unpin' }));
    await waitFor(() => expect(node('t3')).not.toHaveClass('wg-dim'));
  });

  it('pins the lens for selectedJobId', async () => {
    await setup({ selectedJobId: 2 });

    await waitFor(() => expect(node('t1')).toHaveClass('wg-tier--focus'));
  });

  it('pins the lens for selectedNode, replacing a node pinned by a click', async () => {
    const { rerender } = await setup({ selectedNode: 't1' });

    await waitFor(() => expect(node('t1')).toHaveClass('wg-tier--focus'));
    fireEvent.click(node('deploy'));
    await waitFor(() => expect(node('deploy')).toHaveClass('wg-tier--focus'));

    rerender(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={JOIN_GRAPH}
          builds={builds}
          start="~commit"
          selectedNode="t2"
        />
      </div>
    );
    await waitFor(() => expect(node('t2')).toHaveClass('wg-tier--focus'));
    expect(node('deploy')).not.toHaveClass('wg-tier--focus');
  });

  it('only selects on click without the popover', async () => {
    const onSelectJob = vi.fn();

    await setup({ popover: false, onSelectJob });
    fireEvent.click(node('t1'));

    expect(onSelectJob).toHaveBeenCalledWith(
      expect.objectContaining({ name: 't1' })
    );
    expect(await screen.findByText('Following t1')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the popover and reports actions', async () => {
    const user = fastUser();
    const onJobAction = vi.fn();
    const onSelectJob = vi.fn();

    await setup({ onJobAction, onSelectJob });
    fireEvent.click(node('t1'));

    const dialog = await screen.findByRole('dialog', { name: 't1' });

    expect(onSelectJob).toHaveBeenCalledWith(
      expect.objectContaining({ name: 't1', buildId: 2 })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Go to build details' })
    );
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'view-build',
      node: expect.objectContaining({ name: 't1', buildId: 2 })
    });

    fireEvent.click(node('t1'));

    const t1Dialog = await screen.findByRole('dialog');

    // A job that already ran can still be started fresh.
    expect(
      within(t1Dialog).getByRole('button', { name: 'New Run (Fresh)' })
    ).toBeInTheDocument();
    await user.click(
      within(t1Dialog).getByRole('button', { name: 'Restart (Inherit)' })
    );
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'restart',
      node: expect.objectContaining({ name: 't1' })
    });
  });

  it('offers Stop only for active builds and Start for jobs that have not run', async () => {
    const user = fastUser();
    const onJobAction = vi.fn();

    await setup({ onJobAction });
    fireEvent.click(node('t2'));

    const stop = within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Stop build'
    });

    await user.click(stop);
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'stop',
      node: expect.objectContaining({ name: 't2', buildId: 3 })
    });

    fireEvent.click(node('deploy'));

    const deployDialog = await screen.findByRole('dialog');

    // Both run kinds are offered even though nothing has run.
    expect(
      within(deployDialog).getByRole('button', { name: 'Restart (Inherit)' })
    ).toBeInTheDocument();
    await user.click(
      within(deployDialog).getByRole('button', { name: 'New Run (Fresh)' })
    );
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'start',
      node: expect.objectContaining({ name: 'deploy' })
    });
  });

  it('hides start/stop when read-only', async () => {
    const user = fastUser();

    await setup({ readOnly: true });
    fireEvent.click(node('t2'));

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).queryByRole('button', { name: 'Stop build' })
    ).toBeNull();
    expect(
      within(dialog).getByRole('button', { name: 'Go to build details' })
    ).toBeInTheDocument();
  });

  it('closes the popover when another event is shown', async () => {
    const { rerender } = await setup({ eventId: 100 });

    fireEvent.click(node('t1'));
    await screen.findByRole('dialog', { name: 't1' });

    rerender(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={JOIN_GRAPH}
          builds={builds}
          start="~commit"
          eventId={99}
        />
      </div>
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 't1' })).toBeNull()
    );
  });

  it('opens external pipelines from the popover', async () => {
    const user = fastUser();
    const onJobAction = vi.fn();

    await setup({ onJobAction, graph: EXTERNAL });
    fireEvent.click(node('sd@5:ext'));
    await user.click(
      await screen.findByRole('button', { name: 'Go to remote pipeline' })
    );
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'open-external',
      pipelineId: '5',
      jobName: 'ext'
    });
  });

  it('does not open a popover for ~commit triggers', async () => {
    const user = fastUser();

    await setup();
    fireEvent.click(node('~commit'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('searches and dims non-matching nodes', async () => {
    await setup();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search jobs' }), {
      target: { value: 'dep' }
    });

    expect(await screen.findByText('1 match')).toBeInTheDocument();
    expect(node('deploy')).toHaveClass('wg-match');
    expect(node('t1')).toHaveClass('wg-dim');
  });

  it('toggles labels', async () => {
    const user = fastUser();

    await setup();
    expect(node('build').querySelector('.wg-label')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Hide labels' }));
    await waitFor(() =>
      expect(node('build').querySelector('.wg-label')).toBeNull()
    );
    expect(node('build')).toHaveAttribute('title', 'build');
    expect(
      screen.getByRole('button', { name: 'Show labels' })
    ).toBeInTheDocument();
  });

  it('shows progress counts and filters by state', async () => {
    const user = fastUser();

    await setup();

    const group = screen.getByRole('group', { name: 'Event progress' });

    expect(
      within(group).getByRole('button', { name: '2 done' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: '1 running' })
    ).toBeInTheDocument();

    await user.click(within(group).getByRole('button', { name: '1 running' }));
    await waitFor(() => expect(node('t1')).toHaveClass('wg-dim'));
    expect(node('t2')).not.toHaveClass('wg-dim');
  });

  it('enables jump to active only when something is running', async () => {
    const { unmount } = await setup();

    expect(
      screen.getByRole('button', { name: 'Jump to active' })
    ).toBeEnabled();
    unmount();
    await setup({ builds: [b(1, 1, 'SUCCESS')] });
    expect(
      screen.getByRole('button', { name: 'Jump to active' })
    ).toBeDisabled();
  });

  it('navigates the lens with arrow keys', async () => {
    const user = fastUser();

    await setup();
    fireEvent.click(node('build'));
    fireEvent.keyDown(node('build'), { key: 'ArrowRight' });
    await waitFor(() =>
      expect(screen.getByText('Following t1')).toBeInTheDocument()
    );
    fireEvent.keyDown(node('t1'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Following t1')).toBeNull());
  });

  it('leaves arrow keys in the search box to the caret', async () => {
    await setup();
    fireEvent.click(node('build'));
    expect(await screen.findByText('Following build')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowRight' });

    expect(screen.getByText('Following build')).toBeInTheDocument();
    expect(screen.queryByText('Following t1')).toBeNull();
  });

  it('renders stage boxes with children and collapses them', async () => {
    const user = fastUser();
    const onCollapsedStagesChange = vi.fn();

    renderWithProviders(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={STAGES_GRAPH}
          stages={STAGES}
          jobs={STAGE_JOBS}
          onCollapsedStagesChange={onCollapsedStagesChange}
        />
      </div>
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );
    expect(node('ci-test')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Collapse stage production' })
    );
    expect(onCollapsedStagesChange).toHaveBeenCalledWith(
      new Set(['production'])
    );
    // internal state also collapses it
    await waitFor(() =>
      expect(node('stage@production jobs (3)')).toBeInTheDocument()
    );
    expect(document.querySelector('[data-stage="production"]')).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Expand stage production' })
    );
    await waitFor(() =>
      expect(document.querySelector('[data-stage="production"]')).not.toBeNull()
    );
  });

  it('starts a stage', async () => {
    const user = fastUser();
    const onJobAction = vi.fn();

    renderWithProviders(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={STAGES_GRAPH}
          stages={STAGES}
          jobs={STAGE_JOBS}
          onJobAction={onJobAction}
        />
      </div>
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );
    await user.click(
      within(
        document.querySelector('[data-stage="integration"]') as HTMLElement
      ).getByRole('button', { name: 'Start stage' })
    );

    // The stage menu offers Restart (Inherit) and New Run (Fresh).
    const dialog = within(
      await screen.findByRole('dialog', { name: 'integration' })
    );

    expect(dialog.getByText(/Run stage at/)).toBeInTheDocument();
    expect(
      dialog.getByText("Use this event's metadata and build statuses.")
    ).toBeInTheDocument();
    expect(
      dialog.getByText(
        'Clean start from this stage. No metadata or build statuses.'
      )
    ).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Restart (Inherit)' }));
    expect(onJobAction).toHaveBeenCalledWith({
      type: 'start-stage',
      action: 'restart',
      stage: expect.objectContaining({ name: 'integration', id: 7 })
    });

    await user.click(
      within(
        document.querySelector('[data-stage="integration"]') as HTMLElement
      ).getByRole('button', { name: 'Start stage' })
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'New Run (Fresh)'
      })
    );
    expect(onJobAction).toHaveBeenLastCalledWith({
      type: 'start-stage',
      action: 'start',
      stage: expect.objectContaining({ name: 'integration' })
    });
  });

  it('hides the stage menu when read-only', async () => {
    renderWithProviders(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={STAGES_GRAPH}
          stages={STAGES}
          jobs={STAGE_JOBS}
          readOnly
        />
      </div>
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );
    expect(
      within(
        document.querySelector('[data-stage="integration"]') as HTMLElement
      ).queryByRole('button', { name: 'Start stage' })
    ).toBeNull();
  });

  it('dims every node outside highlightNodes', async () => {
    await setup({ highlightNodes: new Set(['t1', 'build']) });

    await waitFor(() => expect(node('t3')).toHaveClass('wg-dim'));
    expect(node('t1')).not.toHaveClass('wg-dim');
    expect(node('build')).not.toHaveClass('wg-dim');
  });

  it('ignores highlightNodes that match nothing in the graph', async () => {
    await setup({ highlightNodes: new Set(['nope']) });

    expect(node('t3')).not.toHaveClass('wg-dim');
  });

  it('renders downstream trigger nodes', async () => {
    renderWithProviders(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph
          graph={JOIN_GRAPH}
          downstreamTriggers={[
            { jobName: 'build', triggers: ['~sd@9:a', '~sd@10:b'] }
          ]}
        />
      </div>
    );
    await waitFor(() => expect(node('~sd-build-triggers')).toBeInTheDocument());
    expect(node('~sd-build-triggers')).toHaveTextContent(
      'Triggers 2 pipelines'
    );
  });

  it('shows an empty state', () => {
    renderWithProviders(<WorkflowGraph graph={{ nodes: [], edges: [] }} />);
    expect(
      screen.getByText('This pipeline has no jobs to show.')
    ).toBeInTheDocument();
  });

  it('renders a static mini variant without controls', async () => {
    renderWithProviders(
      <div style={{ width: 300, height: 100 }}>
        <WorkflowGraph graph={JOIN_GRAPH} builds={builds} variant="mini" />
      </div>
    );
    await waitFor(() => expect(node('build')).toBeInTheDocument());
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(node('build').querySelector('.wg-label')).toBeNull();
  });

  it('renders Japanese UI strings', async () => {
    renderWithProviders(
      <div style={{ width: 1000, height: 600 }}>
        <WorkflowGraph graph={JOIN_GRAPH} builds={builds} />
      </div>,
      { locale: 'ja' }
    );
    expect(
      await screen.findByRole('button', { name: '全体を表示' })
    ).toBeInTheDocument();
  });
});
