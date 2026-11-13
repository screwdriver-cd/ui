import type { WorkflowGraphData } from '../types';
import { isRoot, reverseGraph, subgraphFilter } from './subgraph';
import type { EventStage } from './decorate';
import { isDownstreamTriggerNode, isExternalNode } from './names';

export type ActiveTab = 'events' | 'pulls';

// `~pr`, or a branch-filtered PR trigger such as `~pr:main` or a `~pr:/regex/` one.
const isPrTrigger = (name: string) => name === '~pr' || name.startsWith('~pr:');

/** Can the job be (re)started from the given view? */
export function canJobStart(activeTab: ActiveTab, graph: WorkflowGraphData, jobName: string): boolean {
  const subgraph = subgraphFilter(reverseGraph(graph), jobName);
  const isOnPrPath = subgraph.nodes.some(n => isPrTrigger(n.name));

  if (activeTab === 'pulls') {
    return isOnPrPath;
  }

  if (isOnPrPath) {
    // A job triggered only by PR triggers cannot be started from the events view.
    const { nodes, edges } = reverseGraph(subgraph);

    return nodes.some(n => isRoot(edges, n.name) && !isPrTrigger(n.name));
  }

  return true;
}

/** Can the stage be started from the given view? Uses the stage's setup job. */
export function canStageStart(
  activeTab: ActiveTab,
  graph: WorkflowGraphData,
  stage: Pick<EventStage, 'setup'>
): boolean {
  if (activeTab === 'pulls' || !stage.setup) {
    return false;
  }

  return canJobStart(activeTab, graph, stage.setup.name);
}

/** Trigger nodes (`~commit`, `~pr`, branch triggers) have no popover. */
export function nodeCanShowTooltip(node: { name: string }): boolean {
  const { name } = node;

  return name !== '~commit' && name !== '~pr' && !name.startsWith('~commit:') && !name.startsWith('~pr:');
}

export type NodeKind = 'trigger' | 'external' | 'downstream' | 'stage-group' | 'job';

export function nodeKind(node: { name: string; type?: string }): NodeKind {
  if (node.type === 'JOB_GROUP') return 'stage-group';
  if (isDownstreamTriggerNode(node.name)) return 'downstream';
  if (isExternalNode(node.name)) return 'external';
  if (node.name.startsWith('~')) return 'trigger';

  return 'job';
}
