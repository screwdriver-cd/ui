import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '~/test/render';
import { decorateGraph } from '../decorate';
import {
  JOIN_GRAPH,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from '../fixtures/graphs';
import { clearLayoutCache, computeLayout } from '../layout/client';
import { COMPACT_SIZE, toLayoutInput } from '../layout/input';
import { createTextMeasurer } from '../layout/measure';
import type { BuildLite } from '../types';
import { mockReactFlowEnvironment } from './testSetup';
import { WorkflowGraph } from './WorkflowGraph';

beforeEach(() => mockReactFlowEnvironment());
beforeEach(() => clearLayoutCache());

const builds: BuildLite[] = [
  { id: 1, jobId: 1, status: 'SUCCESS' },
  { id: 2, jobId: 2, status: 'SUCCESS', parentBuildId: 1 },
  { id: 3, jobId: 3, status: 'RUNNING', parentBuildId: 1 },
  { id: 4, jobId: 4, status: 'FAILURE', parentBuildId: 1 }
];
const node = (name: string) =>
  document.querySelector(`[data-node="${name}"]`) as HTMLElement;

describe('mini variant', () => {
  async function mini(
    props: Partial<React.ComponentProps<typeof WorkflowGraph>> = {}
  ) {
    const onSelectJob = vi.fn();
    const onJobAction = vi.fn();

    renderWithProviders(
      <div style={{ width: 300, height: 100 }}>
        <WorkflowGraph
          graph={JOIN_GRAPH}
          builds={builds}
          start="~commit"
          variant="mini"
          onSelectJob={onSelectJob}
          onJobAction={onJobAction}
          {...props}
        />
      </div>
    );
    await waitFor(() => expect(node('build')).toBeInTheDocument());

    return { onSelectJob, onJobAction };
  }

  it('has status-coloured, label-free, non-focusable blocks and no controls', async () => {
    await mini();

    expect(node('t3')).toHaveClass('wg-mini', 'wg-status--FAILURE');
    expect(node('t2')).toHaveClass('wg-status--RUNNING');
    expect(node('build')).toHaveClass('wg-status--SUCCESS');
    expect(node('t3').textContent).toBe('');
    expect(node('t3')).not.toHaveAttribute('tabindex');
    expect(node('t3')).not.toHaveAttribute('role', 'button');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('searchbox')).toBeNull();
    // React Flow's minimap is an img named after the graph.
    expect(screen.queryByRole('img', { name: 'Workflow graph' })).toBeNull();
    // The background is a decorative React Flow layer with no role.
    expect(document.querySelector('.react-flow__background')).toBeNull();
  });

  it('is static: clicks and hovers do nothing', async () => {
    const { onSelectJob, onJobAction } = await mini();

    fireEvent.click(node('t3'));
    fireEvent.mouseEnter(node('t3'));
    expect(onSelectJob).not.toHaveBeenCalled();
    expect(onJobAction).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
    // Dimming is a visual-only state with no ARIA equivalent.
    expect(document.querySelector('.wg-dim')).toBeNull();
    // No lens (or any other) status readout.
    expect(screen.queryByRole('status', { hidden: true })).toBeNull();
  });

  it('renders expanded stages as bare boxes (no header or buttons) and collapsed stage nodes as blocks', async () => {
    renderWithProviders(
      <div style={{ width: 600, height: 120 }}>
        <WorkflowGraph
          graph={STAGES_GRAPH}
          stages={STAGES}
          jobs={STAGE_JOBS}
          collapsedStages={new Set(['production'])}
          variant="mini"
        />
      </div>
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-stage="integration"]')
      ).not.toBeNull()
    );

    // No stage header: the expanded stage's name is not rendered.
    expect(screen.queryByText('integration')).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(node('stage@production jobs (3)')).toHaveClass('wg-mini');
  });

  it('is rendered with the same model, decoration and layout: only the scale differs', async () => {
    const measure = createTextMeasurer();
    const d = decorateGraph({
      graph: STAGES_GRAPH,
      stages: STAGES,
      collapsedStages: new Set(),
      jobs: STAGE_JOBS
    });
    const full = await computeLayout(toLayoutInput(d, { measure }));
    const small = await computeLayout(
      toLayoutInput(d, { measure, showLabels: false, compact: true })
    );

    expect(small.nodes.map(n => n.id)).toEqual(full.nodes.map(n => n.id));
    expect(small.stages.map(s => s.name)).toEqual(full.stages.map(s => s.name));
    expect(small.edges.map(e => [e.layoutSrc, e.layoutDest])).toEqual(
      full.edges.map(e => [e.layoutSrc, e.layoutDest])
    );
    expect(
      small.nodes.every(
        n => n.width <= COMPACT_SIZE && n.height <= COMPACT_SIZE
      )
    ).toBe(true);
    expect(small.width).toBeLessThan(full.width / 3);
    expect(small.height).toBeLessThan(full.height);
  });
});
