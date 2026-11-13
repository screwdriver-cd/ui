import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '~/test/render';
import { JOIN_GRAPH } from '../fixtures/graphs';
import { clearLayoutCache } from '../layout/client';
import type { BuildLite } from '../types';
import { mockReactFlowEnvironment } from './testSetup';
import { WorkflowGraph } from './WorkflowGraph';
import type { WorkflowGraphProps } from './types';

beforeEach(() => mockReactFlowEnvironment());
beforeEach(() => clearLayoutCache());

// job ids: build=1 t1=2 t2=3 t3=4 deploy=5. deploy is an AND join whose build was created but is still waiting.
const waiting: BuildLite[] = [
  { id: 1, jobId: 1, status: 'SUCCESS' },
  { id: 2, jobId: 2, status: 'SUCCESS', parentBuildId: 1 },
  { id: 3, jobId: 3, status: 'RUNNING', parentBuildId: 1 },
  { id: 4, jobId: 4, status: 'RUNNING', parentBuildId: 1 },
  { id: 5, jobId: 5, status: 'CREATED', parentBuildId: [2] }
];

async function open(props: Partial<WorkflowGraphProps> = {}) {
  renderWithProviders(
    <div style={{ width: 1000, height: 600 }}>
      <WorkflowGraph
        graph={JOIN_GRAPH}
        builds={waiting}
        start="~commit"
        {...props}
      />
    </div>
  );
  await waitFor(() =>
    expect(document.querySelector('[data-node="deploy"]')).not.toBeNull()
  );
  fireEvent.click(
    document.querySelector('[data-node="deploy"]') as HTMLElement
  );

  return within(await screen.findByRole('dialog'));
}

describe('a job that waits on a join', () => {
  it('offers no Start, Restart or Stop: the API refuses to stop a CREATED build', async () => {
    const dialog = await open();

    expect(
      dialog.getByText(/Waiting for the other join inputs/)
    ).toBeInTheDocument();
    expect(
      dialog.queryByRole('button', { name: /New Run|Restart/ })
    ).toBeNull();

    // Build details are not available for a CREATED build.
    expect(
      dialog.getByRole('button', { name: 'Go to build details' })
    ).toBeDisabled();
    // PUT /builds/:id only accepts RUNNING, QUEUED, BLOCKED, UNSTABLE or FROZEN builds.
    expect(dialog.queryByRole('button', { name: 'Stop build' })).toBeNull();
  });

  it('shows the join progress on the node (1 of 3 inputs done)', async () => {
    await open();
    expect(screen.getByTestId('join-and')).toHaveTextContent(/1\s*\/\s*3|1.*3/);
  });
});
