import ENV from 'screwdriver-ui/config/environment';

/**
 * Get the display job name length
 * @param userSettings {Object} The user settings in the shape returned by the API
 * @returns {number}
 */
export const getDisplayJobNameLength = userSettings => {
  return userSettings?.displayJobNameLength
    ? userSettings.displayJobNameLength
    : ENV.APP.MINIMUM_JOBNAME_LENGTH;
};

/**
 * Filters the workflow graph by removing nodes that start with 'sd@' (i.e., triggers external pipelines) and are the last job in the chain
 * @param workflowGraph {{nodes: Array, edges: Array}} The workflow graph to filter
 */
export const getFilteredGraph = workflowGraph => {
  const externalJobPrefix = 'sd@';

  if (
    workflowGraph.nodes.filter(node => node.name.startsWith(externalJobPrefix))
      .length === 0
  ) {
    return workflowGraph;
  }

  const externalJobsToKeep = new Set();

  workflowGraph.edges.forEach(edge => {
    if (edge.src.startsWith(externalJobPrefix)) {
      externalJobsToKeep.add(edge.src);
    }
  });

  const nodes = workflowGraph.nodes.filter(node => {
    return (
      !node.name.startsWith(externalJobPrefix) ||
      externalJobsToKeep.has(node.name)
    );
  });

  const edges = workflowGraph.edges.filter(edge => {
    return (
      !edge.dest.startsWith(externalJobPrefix) ||
      externalJobsToKeep.has(edge.dest)
    );
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
