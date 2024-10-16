/**
 * Filters the workflow graph by removing nodes that start with 'sd@' (i.e., triggers external pipelines)
 * @param workflowGraph {{nodes: Array, edges: Array}} The workflow graph to filter
 */
export const getFilteredGraph = workflowGraph => {
  const nodes = workflowGraph.nodes.filter(node => {
    return !node.name.startsWith('sd@');
  });

  const edges = workflowGraph.edges.filter(edge => {
    return !edge.dest.startsWith('sd@');
  });

  return { nodes, edges };
};

/**
 * Get the workflow graph with or without downstream triggers
 * @param workflowGraph {{nodes: Array, edges: Array}} The workflow graph
 * @param [triggers] {Array} Triggers in the shape returned by the API
 */
export const getWorkflowGraph = (workflowGraph, triggers) => {
  if (triggers) {
    const workflowGraphWithDownstreamTriggers = structuredClone(
      getFilteredGraph(workflowGraph)
    );

    triggers.forEach(trigger => {
      if (trigger.triggers.length > 0) {
        workflowGraphWithDownstreamTriggers.nodes.push({
          name: `~sd-${trigger.jobName}-triggers`,
          triggers: trigger.triggers,
          status: 'DOWNSTREAM_TRIGGER'
        });
        workflowGraphWithDownstreamTriggers.edges.push({
          src: trigger.jobName,
          dest: `~sd-${trigger.jobName}-triggers`
        });
      }
    });

    return workflowGraphWithDownstreamTriggers;
  }

  return getFilteredGraph(workflowGraph);
};
