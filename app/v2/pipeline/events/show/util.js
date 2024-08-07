/**
 * Filters the workflow graph by removing nodes that start with 'sd@' (i.e., triggers external pipelines)
 * @param event
 */
// eslint-disable-next-line import/prefer-default-export
export const getFilteredGraph = workflowGraph => {
  const nodes = workflowGraph.nodes.filter(node => {
    return !node.name.startsWith('sd@');
  });

  const edges = workflowGraph.edges.filter(edge => {
    return !edge.dest.startsWith('sd@');
  });

  return { nodes, edges };
};
