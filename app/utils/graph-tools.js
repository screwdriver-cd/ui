import { get } from '@ember/object';
import DS from 'ember-data';

const edgeSrcBranchRegExp = new RegExp('^~(pr|commit):/(.+)/$');
const triggerBranchRegExp = new RegExp('^~(pr|commit):(.+)$');
const STAGE_SETUP_PATTERN = /^stage@([\w-]+)(?::setup)$/;
const STAGE_TEARDOWN_PATTERN = /^stage@([\w-]+)(?::teardown)$/;

/**
 * Find a node from the list of nodes
 * @method node
 * @param  {Array} nodes  List of graph node objects
 * @param  {String} name  Name of the node to find
 * @return {Object}       Reference to the node in the list
 */
const node = (nodes, name) => nodes.find(o => o.name === name);

/**
 * Find a build for the given job id
 * @method build
 * @param  {Array} builds   List of build objects
 * @param  {String} jobId   The job id of the build
 * @return {Object}         Reference to the build object from the list if found
 */
const build = (builds, jobId) =>
  builds.find(b => b && `${b.jobId}` === `${jobId}`);

/**
 * Find a job for the given job id
 * @method findJob
 * @param  {Array}  jobs    List of job objects
 * @param  {String} jobId   The job id of the build
 * @return {Object}         Reference to the job object from the list if found
 */
const findJob = (jobs, jobId) => jobs.find(j => j && `${j.id}` === `${jobId}`);

/**
 * Find a PR job for the given PR number and job name
 * @method prJob
 * @param  {Array}  jobs    List of job objects
 * @param  {number} prNum   The pull request number of the job
 * @param  {String} name    The name of the pull request job
 * @return {Object}         Reference to the job object from the list if found
 */
const prJob = (jobs, prNum, name) =>
  jobs.find(j => j && j.group === prNum && j.name.endsWith(name));

/**
 * Determines if a job is a setup job of a stage based on the name
 * @method  isStageSetupJob
 * @param   {String}  jobName Name of a job
 * @returns {boolean} true if it is a setup job name; false otherwise
 */
const isStageSetupJob = jobName => STAGE_SETUP_PATTERN.test(jobName);

/**
 * Determines if a job is a setup job of a stage based on the name
 * @method  isStageTeardownJob
 * @param   {String}  jobName Name of a job
 * @returns {boolean} true if it is a setup job name; false otherwise
 */
const isStageTeardownJob = jobName => STAGE_TEARDOWN_PATTERN.test(jobName);

/**
 * Compiles and returns a list of stages and associated jobs by traversing the event workflow graph
 * @method  extractEventStages
 * @param  {Object} graph                            Event workflow graph
 * @param  {Array|DS.PromiseArray} pipelineStages   List of latest stage metadata associated with the pipeline
 * @return {Array}                                  List of stage metadata associated with the event
 */
const extractEventStages = (graph, pipelineStages) => {
  const stageToPipelineStageMap = pipelineStages
    ? pipelineStages.reduce(
        (obj, stage) => ({
          ...obj,
          [stage.name]: stage
        }),
        {}
      )
    : {};
  const stageNameToEventStageMap = {};
  const { nodes } = graph;

  nodes.forEach(n => {
    const { stageName } = n;

    if (stageName) {
      let eventStage = stageNameToEventStageMap[stageName];

      if (eventStage === undefined) {
        const pipelineStage = stageToPipelineStageMap[stageName];

        eventStage = {
          id: pipelineStage.id,
          name: pipelineStage.name,
          description: pipelineStage.description,
          jobs: [],
          setup: null,
          teardown: null
        };

        stageNameToEventStageMap[stageName] = eventStage;
      }

      if (isStageSetupJob(n.name)) {
        eventStage.setup = n;
      } else if (isStageTeardownJob(n.name)) {
        eventStage.teardown = n;
      } else {
        eventStage.jobs.push(n);
      }
    }
  });

  return Object.values(stageNameToEventStageMap);
};

/**
 * Replaces the edges associated with the specified node by creating new edges from the upstream nodes of the specified node
 * to the downstream nodes of the specified node.
 * @method  bypassSetupTeardownEdges
 * @param  {Array} edges       List of edges in the workflow graph
 * @param  {String} nodeName   Name of the node (job) in the workflow graph. Ex: 'stage@prod:setup', 'stage@canary:teardown'
 * @return {Array}             List of edges after replacing the edges associated with specified node
 */
const bypassSetupTeardownEdges = (edges, nodeName) => {
  const resultEdges = [];

  const asSrcEdges = [];
  const asDestEdges = [];

  edges.forEach(e => {
    if (e.src === nodeName) {
      asSrcEdges.push(e);
    } else if (e.dest === nodeName) {
      asDestEdges.push(e);
    } else {
      resultEdges.push(e);
    }
  });

  if (asSrcEdges.length > 0 && asDestEdges.length > 0) {
    asSrcEdges.forEach(asSrcEdge => {
      const newDest = asSrcEdge.dest;

      asDestEdges.forEach(asDestEdge => {
        resultEdges.push({ ...asDestEdge, dest: newDest });
      });
    });
  }

  return resultEdges;
};

/**
 * Extracts the workflow graph (containing nodes and edges) associated with the specified stage
 *
 * @method extractStageNodesAndEdges
 * @param {Object} eventWorkflowGraph   Event workflow graph
 * @param {Object} eventStage           Stage metadata
 * @returns {{nodes: *[], edges: *[]}}  Workflow graph associated with the specified stage
 */
const extractStageNodesAndEdges = (eventWorkflowGraph, eventStage) => {
  const { nodes, edges } = eventWorkflowGraph;
  const jobNames = [
    ...eventStage.jobs,
    eventStage.setup,
    eventStage.teardown
  ].map(j => j.name);
  const newNodes = [];
  const newNodesSet = new Set();
  const newEdges = [];

  nodes.forEach(n => {
    const { name } = n;

    if (jobNames.includes(name)) {
      newNodes.push(n);
      newNodesSet.add(name);
    }
  });

  edges.forEach(e => {
    const { src, dest } = e;

    if (newNodesSet.has(src) && newNodesSet.has(dest)) {
      newEdges.push(e);
    }
  });

  return {
    nodes: newNodes,
    edges: newEdges
  };
};

/**
 * Calculate how many nodes are visited in the graph from the given starting point
 * @method graphDepth
 * @param  {Array}   edges    List of graph edges
 * @param  {String}  start    Node name for starting point
 * @param  {Set}     visited  List of visited nodes
 * @return {Number}           Number of visited nodes
 */
const graphDepth = (edges, start, visited = new Set()) => {
  if (!Array.isArray(edges)) {
    return Number.MAX_VALUE;
  }

  const dests = edges.filter(e => e.src === start);

  // For partials/detached jobs
  if (!start.startsWith('~')) {
    visited.add(start);
  }

  // walk the graph
  if (dests.length) {
    dests.forEach(e => {
      visited.add(e.dest);
      graphDepth(edges, e.dest, visited);
    });
  }

  return visited.size;
};

/**
 * Determines the position (x and y coordinates) for the stage in the event workflow graph.
 * Apply offsets to stage nodes to determine absolute position of the nodes in the event workflow graph.
 * Blocks the cells within stage rows and columns so that non-stage nodes are not positioned inside stage matrix.
 *
 * @method positionStage
 * @param {Number}  x     Start column to position the stage
 * @param {Array}   y     Accumulator of column depth
 * @param {Object}  stage Stage metadata including workflow graph with nodes positioned relatively with in the stage
 */
const positionStage = (x, y, stage) => {
  const stageGraph = stage.graph;
  const stageStartX = x;
  const stageEndX = stageStartX + stageGraph.meta.width - 1;

  // Find a row with no items for all the stage columns
  const stageStartY = Math.max(...y.slice(stageStartX, stageEndX + 1));

  stage.pos = { x: stageStartX, y: stageStartY };

  // Apply offset for all the stage nodes
  stageGraph.nodes.forEach(stageNode => {
    stageNode.pos = {
      x: stageNode.pos.x + stageStartX,
      y: stageNode.pos.y + stageStartY
    };
  });

  // Block all the columns for stage rows
  const afterStageY = stageStartY + stageGraph.meta.height;

  let stageColumn = stageStartX;

  while (stageColumn <= stageEndX) {
    y[stageColumn] = afterStageY;
    stageColumn += 1;
  }
};

/**
 * Walks the graph to find siblings and set their positions
 * @method walkGraph
 * @param  {Object}  graph                Raw graph definition
 * @param  {String}  start                The job name to start from for this iteration
 * @param  {Number}  x                    The column for this iteration
 * @param  {Array}   y                    Accumulator of column depth
 * @param  {Object}  stageNameToStageMap  Map of stage name to stage metadata (also includes workflow graph)
 */
const walkGraph = (graph, start, x, y, stageNameToStageMap) => {
  if (!y[x]) {
    y[x] = y[0] - 1;
  }
  const nodeNames = graph.edges.filter(e => e.src === start).map(e => e.dest);

  nodeNames.forEach(name => {
    const obj = node(graph.nodes, name);

    const { stageName } = obj;

    if (stageName && stageNameToStageMap) {
      const stage = stageNameToStageMap.get(stageName);

      if (!stage.pos) {
        positionStage(x, y, stage);
      }

      // walk if not yet visited
      walkGraph(graph, name, x + 1, y, stageNameToStageMap);
    } else if (!obj.pos) {
      obj.pos = { x, y: y[x] };
      y[x] += 1;

      // walk if not yet visited
      walkGraph(graph, name, x + 1, y, stageNameToStageMap);
    }
  });
};

/**
 * Determine if a node is a root node by seeing if it is listed as a destination
 * @method isRoot
 * @param  {Array}  edges List of graph edges
 * @param  {String}  name The job name to check
 * @return {Boolean}      True if the node is not a dest in edges
 */
const isRoot = (edges, name) => !edges.find(e => e.dest === name);

/**
 * Determine if a node is a trigger by seeing if it matches the startFrom
 * @param  {String}  name  The node name to check
 * @param  {String}  start The start from
 * @return {Boolean}       True if the node matches the startFrom
 */
const isTrigger = (name, start) => {
  // Set a status on the trigger node (if it starts with ~)
  if (name === start && /^~/.test(name)) {
    return true;
  }

  // Set status on trigger node if is branch specific trigger
  // Check if node name has regex
  const edgeSrcBranch = name.match(edgeSrcBranchRegExp);

  if (edgeSrcBranch) {
    // Check if trigger is specific branch commit or pr
    const triggerBranch = start.match(triggerBranchRegExp);

    // Check whether job types of trigger and node name match
    if (triggerBranch && triggerBranch[1] === edgeSrcBranch[1]) {
      // Check if trigger branch and node branch regex match
      if (triggerBranch[2].match(edgeSrcBranch[2])) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Determine if a node has destinations that have already been processed.
 * This allows a graph's common root nodes to collapse instead of taking up multiple lines.
 * @method hasProcessedDest
 * @param  {Object}         graph The processed graph
 * @param  {String}         name  node name
 * @return {Boolean}              True if a destination of the node has already been processed
 */
const hasProcessedDest = (graph, name) => {
  const nodes = graph.edges
    .filter(edge => edge.src === name)
    .map(edge => edge.dest);

  return nodes.some(n => {
    const found = node(graph.nodes, n);

    return found && typeof found.pos === 'object';
  });
};

/**
 * For each node in the graph, determines the position (x and y coordinates) in the workflow graph matrix.
 *
 * @method positionGraphNodes
 * @param {Object} graph  Workflow graph
 * @returns {*}           Returns the graph with position assigned for all the nodes
 */
const positionGraphNodes = graph => {
  const { nodes, edges, stages } = graph;

  const stageNameToStageMap =
    stages && stages.length > 0
      ? stages.reduce((map, s) => {
          map.set(s.name, s);

          return map;
        }, new Map())
      : null;

  let y = [0]; // accumulator for column heights

  nodes.forEach(n => {
    // Set root nodes on left
    if (isRoot(edges, n.name)) {
      if (!hasProcessedDest(graph, n.name)) {
        // find the next unused row
        const tmp = Math.max(...y);

        // Set all the starting pos for columns to that row
        y = y.map(() => tmp);
      }

      const { stageName } = n;

      if (stageName && stageNameToStageMap) {
        const stage = stageNameToStageMap.get(stageName);

        if (!stage.pos) {
          positionStage(0, y, stage);
        }
      } else {
        // Set the node position
        n.pos = { x: 0, y: y[0] };

        // increment by one for next root node
        y[0] += 1;
      }

      // recursively walk the graph from root/ detached node
      walkGraph(graph, n.name, 1, y, stageNameToStageMap);
    }
  });

  // For auto-scaling canvas size
  graph.meta = {
    // Validator starts with a graph with no nodes or edges. Should have a size of at least 1
    height: Math.max(1, ...y),
    width: Math.max(1, y.length - 1)
  };

  return graph;
};

/**
 * Extracts the workflow graph (containing nodes and edges) associated with the specified stage.
 * Determines the relative position of the nodes within the stage matrix.
 *
 * @method initStageGraph
 * @param {Object} eventWorkflowGraph   Event workflow graph
 * @param {Object} eventStage           Stage metadata
 * @returns {{nodes: *[], edges: *[]}}
 */
const initStageGraph = (eventWorkflowGraph, eventStage) => {
  const stageGraph = extractStageNodesAndEdges(eventWorkflowGraph, eventStage);

  positionGraphNodes(stageGraph);

  return stageGraph;
};

/**
 * Filter to the subgraph in which the root is the start from node
 * @param   {Array}   [{nodes}]   Array of graph vertices
 * @param   {Array}   [{edges}]   Array of graph edges
 * @param   {String}  [startNode] Starting/trigger node
 * @returns {Object}              Nodes and edges for the filtered subgraph
 */
const subgraphFilter = ({ nodes, edges }, startNode) => {
  if (!startNode || !nodes.length) {
    return { nodes, edges };
  }

  let start = startNode;

  // startNode can be a PR job in PR events, so trim PR prefix from node name
  if (startNode.match(/^PR-[0-9]+:/)) {
    start = startNode.split(':')[1];
  }

  const visiting = [start];

  const visited = new Set(visiting);

  if (edges.length) {
    while (visiting.length) {
      const cur = visiting.shift();

      edges.forEach(e => {
        if (e.src === cur && !visited.has(e.dest)) {
          visiting.push(e.dest);
          visited.add(e.dest);
        }
      });
    }
  }

  return {
    nodes: nodes.filter(n => visited.has(n.name)),
    edges: edges.filter(e => visited.has(e.src) && visited.has(e.dest))
  };
};

/**
 * Clones and decorates an input graph data structure into something that can be used to display
 * a custom directed graph
 * @method decorateGraph
 * @param  {Object}      inputGraph A directed graph representation { nodes: [], edges: [] }
 * @param  {Array|DS.PromiseArray|DS.PromiseManyArray}  [builds]     A list of build metadata
 * @param  {Array|DS.PromiseArray|DS.PromiseManyArray}  [jobs]       A list of job metadata
 * @param  {String}   [start]     Node name that indicates what started the graph
 * @param  {Boolean}  [chainPR]   Boolean flag for the chainPR setting
 * @param  {number}   [prNum]     The pull request number
 * @param  {Array|DS.PromiseArray}  [stages]     A list of stage metadata
 * @return {Object}                 A graph representation with row/column coordinates for drawing, and meta information for scaling
 */
const decorateGraph = ({
  inputGraph,
  builds,
  jobs,
  start,
  chainPR,
  prNum,
  stages: pipelineStages
}) => {
  // deep clone
  const originalGraph = JSON.parse(JSON.stringify(inputGraph));
  const originalNodes = originalGraph.nodes;
  const originalEdges = originalGraph.edges;

  const buildsAvailable =
    (Array.isArray(builds) ||
      builds instanceof DS.PromiseArray ||
      builds instanceof DS.PromiseManyArray) &&
    builds.length;
  const jobsAvailable =
    (Array.isArray(jobs) ||
      jobs instanceof DS.PromiseArray ||
      jobs instanceof DS.PromiseManyArray) &&
    jobs.length;

  const eventStages =
    pipelineStages && pipelineStages.length > 0
      ? extractEventStages(inputGraph, pipelineStages)
      : [];

  const graph = {};

  const virtualSetupNodes = [];
  const virtualTeardownNodes = [];
  const nodes = [];

  originalNodes.forEach(n => {
    const { name: jobName, virtual } = n;

    // displayName may be Numeric
    // e.g. screwdriver.cd/displayName: 12345 (NOT "12345")
    if (n.displayName) {
      n.displayName = String(n.displayName);
    }

    // Remove setup and teardown nodes
    if (virtual && isStageSetupJob(jobName)) {
      virtualSetupNodes.push(n);
    } else if (virtual && isStageTeardownJob(jobName)) {
      virtualTeardownNodes.push(n);
    } else {
      nodes.push(n);
    }
  });

  graph.nodes = nodes;

  let edges = originalEdges;

  // Bypass setup/teardown edges
  virtualSetupNodes.forEach(setupNode => {
    edges = bypassSetupTeardownEdges(edges, setupNode.name);
  });

  virtualTeardownNodes.forEach(teardownNode => {
    edges = bypassSetupTeardownEdges(edges, teardownNode.name);
  });

  graph.edges = edges;

  graph.stages = eventStages.map(s => {
    const stageGraph = initStageGraph(graph, s);

    s.graph = stageGraph;

    return s;
  });

  // Decorate nodes with position
  positionGraphNodes(graph);

  // Decorate nodes with status

  nodes.forEach(n => {
    // Get job information
    let jobId = n.id;

    if (jobsAvailable) {
      let job = findJob(jobs, jobId);

      if (!jobId && !chainPR && prNum) {
        job = prJob(jobs, prNum, n.name);
        jobId = job?.id;
      }

      // eslint-disable-next-line no-nested-ternary
      n.isDisabled = job
        ? job.isDisabled === undefined
          ? false
          : job.isDisabled
        : false;

      // Set build status to disabled if job is disabled
      if (n.isDisabled) {
        const { state } = job;
        const stateWithCapitalization =
          state[0].toUpperCase() + state.substring(1).toLowerCase();
        const { stateChanger } = job;

        n.status = state;
        n.stateChangeMessage = stateChanger
          ? `${stateWithCapitalization} by ${stateChanger}`
          : stateWithCapitalization;
      }

      // Set manualStartEnabled on the node
      const annotations = job ? get(job, 'permutations.0.annotations') : null;

      if (annotations) {
        n.manualStartDisabled =
          'screwdriver.cd/manualStartEnabled' in annotations
            ? !annotations['screwdriver.cd/manualStartEnabled']
            : false;
      }

      const description = job ? get(job, 'permutations.0.description') : null;

      if (description) {
        n.description = description;
      }
    }

    // Get build information
    if (buildsAvailable && jobId) {
      const b = build(builds, jobId);

      // Add build information to node
      if (b) {
        n.status = b.status;
        n.buildId = b.id;
      }
    }

    // Set a STARTED_FROM status on the trigger node
    if (start && isTrigger(n.name, start)) {
      n.status = 'STARTED_FROM';
    }
  });

  // prTriggeredNodes is only calculated for non-chain PR pipelines in the PR view
  const prTriggeredNodes =
    !chainPR && prNum
      ? subgraphFilter(graph, '~pr').nodes.filter(
          graphNode => graphNode.name !== '~pr'
        )
      : null;

  // Decorate edges with positions and status
  edges.forEach(e => {
    const srcNode = node(nodes, e.src);
    const destNode = node(nodes, e.dest);

    if (!srcNode || !destNode) {
      return;
    }

    e.from = srcNode.pos;
    e.to = destNode.pos;

    if (srcNode.status && srcNode.status !== 'RUNNING') {
      if (prTriggeredNodes && node(prTriggeredNodes, srcNode.name)) {
        // For non-chain PR pipelines, PR triggered jobs do not need outbound edges to have a status as they are the last node in the chain.
      } else {
        e.status = srcNode.status;
      }
    }
  });

  return graph;
};

/**
 * remove branch of given node and its children
 * @param  {Node} node     Given node n
 * @param  {Graph} graph   Given graph
 * @return {undefined}     Removal operation is in-place
 */
const removeBranch = (n, graph) => {
  if (n && n.name) {
    const inEdges = graph.edges.filter(edge => edge.dest === n.name).length;

    // remove node if it only has 1 edge
    if (inEdges === 0) {
      // keep a copy of edges to aid in-place edge removal
      const edges = graph.edges.slice(0);

      edges.forEach(edge => {
        if (edge.src === n.name) {
          const nodeToBeRemoved = graph.nodes.findBy('name', edge.dest);

          graph.edges.removeObject(edge);

          removeBranch(nodeToBeRemoved, graph);
        }
      });

      graph.nodes.removeObject(n);
    }
  }
};

/**
 * Reverses a graph by flipping the edge source and destinations values
 * @param {Graph} graph   A directed graph representation { nodes: [], edges: [] }
 * @return {Graph}        A new graph representing the reversed graph
 */
const reverseGraph = graph => {
  // deep clone
  const reversedGraph = JSON.parse(JSON.stringify(graph));

  reversedGraph.edges.forEach(edge => {
    const { src } = edge;

    edge.src = edge.dest;
    edge.dest = src;
  });

  return reversedGraph;
};

export {
  node,
  decorateGraph,
  graphDepth,
  isRoot,
  isTrigger,
  subgraphFilter,
  removeBranch,
  reverseGraph
};
