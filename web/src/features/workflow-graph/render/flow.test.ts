import type { DecoratedNode } from '../decorate/decorate';
import type { WorkflowGraphData } from '../types';
import { nodeInfo } from './flow';

const graph: WorkflowGraphData = {
  nodes: [{ name: '~commit' }, { name: 'main', id: 1 }],
  edges: [{ src: '~commit', dest: 'main' }]
};
const node = (extra: Partial<DecoratedNode> = {}): DecoratedNode => ({
  name: 'main',
  id: 1,
  status: 'SUCCESS',
  ...extra
});

describe('nodeInfo start eligibility', () => {
  it('allows start for a normal finished job', () => {
    expect(nodeInfo(node(), graph, 'events', false).canStart).toBe(true);
  });

  it('does not expose start/restart when manual start is disabled', () => {
    const info = nodeInfo(
      node({ manualStartDisabled: true }),
      graph,
      'events',
      false
    );

    expect(info.canStart).toBe(false);
    expect(info.manualStartDisabled).toBe(true);
  });

  it('does not expose start for disabled jobs', () => {
    expect(
      nodeInfo(node({ isDisabled: true }), graph, 'events', false).canStart
    ).toBe(false);
  });
});

describe('nodeInfo stop / toggle', () => {
  it('can stop a FROZEN build and still start the job', () => {
    const info = nodeInfo(
      node({ status: 'FROZEN', buildId: 9 }),
      graph,
      'events',
      false
    );

    expect(info.canStop).toBe(true);
    expect(info.canStart).toBe(true);
  });

  it('cannot stop a finished build', () => {
    expect(nodeInfo(node({ buildId: 9 }), graph, 'events', false).canStop).toBe(
      false
    );
  });

  it('can toggle a real job unless read-only', () => {
    expect(nodeInfo(node(), graph, 'events', false).canToggle).toBe(true);
    expect(nodeInfo(node(), graph, 'events', true).canToggle).toBe(false);
    expect(
      nodeInfo(node({ status: 'FROZEN', buildId: 9 }), graph, 'events', true)
        .canStop
    ).toBe(false);
    expect(
      nodeInfo(node({ id: undefined }), graph, 'events', false).canToggle
    ).toBe(false);
  });

  it('drops the blank state change message the API stores without a reason', () => {
    expect(
      nodeInfo(node({ stateChangeMessage: ' ' }), graph, 'events', false)
        .stateChangeMessage
    ).toBeUndefined();
    expect(
      nodeInfo(node({ stateChangeMessage: 'flaky' }), graph, 'events', false)
        .stateChangeMessage
    ).toBe('flaky');
  });
});
