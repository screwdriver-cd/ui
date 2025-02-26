import { isRoot, reverseGraph, subgraphFilter } from './graph-tools';

/**
 * Determines if a job node can be triggered from the view indicated by the activeTab
 * @param activeTab{string} The active tab that is selected
 * @param pipelineGraph     Pipeline graph as {nodes, edges}
 * @param jobName{string}   Job name of the node in question
 * @returns {boolean}       True if the node can be started from the given view, false otherwise
 */
export function canJobStart(activeTab, pipelineGraph, jobName) {
  const reversedGraph = reverseGraph(pipelineGraph);
  const subgraph = subgraphFilter(reversedGraph, jobName);

  const isOnPrPath =
    subgraph.nodes.filter(node => node.name === '~pr').length > 0;

  if (activeTab === 'pulls') {
    // In the pull request view, only allow restarting nodes that are reachable from the ~pr node
    return isOnPrPath;
  }

  // In the events view:
  if (isOnPrPath) {
    // Jobs that can be triggered by ~pr need to be checked that they are not triggered by only ~pr (i.e., a job triggered by ~pr and a detached job)
    const { nodes, edges } = reverseGraph(subgraph);

    let numRoots = 0;

    nodes.forEach(node => {
      if (isRoot(edges, node.name)) {
        numRoots += 1;
      }
    });

    return numRoots > 1;
  }

  return true;
}

/**
 * Determines if a stage can be triggered from the view indicated by the activeTab
 * @param activeTab{string} The active tab that is selected
 * @param pipelineGraph     Pipeline graph as {nodes, edges}
 * @param jobName{string}   Stage in question
 * @returns {boolean}       True if the stage can be started from the given view, false otherwise
 */
export function canStageStart(activeTab, pipelineGraph, stage) {
  if (activeTab === 'pulls') {
    return false;
  }

  return canJobStart(activeTab, pipelineGraph, `stage@${stage.name}:setup`);
}
