import { get } from '@ember/object';
import DS from 'ember-data';

const STATUS_MAP = {
  SUCCESS: { icon: '\ue903' },
  STARTED_FROM: { icon: '\ue907' },
  DOWNSTREAM_TRIGGER: { icon: '\ue907' },
  RUNNING: { icon: '\ue905' },
  QUEUED: { icon: '\ue904' },
  ABORTED: { icon: '\ue900' },
  FAILURE: { icon: '\ue906' },
  DISABLED: { icon: '\ue902' },
  UNKNOWN: { icon: '\ue901' },
  UNSTABLE: { icon: '\ue909' },
  BLOCKED: { icon: '\ue908' },
  COLLAPSED: { icon: '\ue908' },
  FROZEN: { icon: '\ue910' },
  // TODO: Replace skipped property if necessary.
  SKIPPED: { icon: '\ue909' }
};
const edgeSrcBranchRegExp = new RegExp('^~(pr|commit):/(.+)/$');
const triggerBranchRegExp = new RegExp('^~(pr|commit):(.+)$');

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
 * @method job
 * @param  {Array}  jobs    List of job objects
 * @param  {String} jobId   The job id of the build
 * @return {Object}         Reference to the job object from the list if found
 */
const job = (jobs, jobId) => jobs.find(j => j && `${j.id}` === `${jobId}`);

/**
 * Find the icon to set as the text for a node
 * @method icon
 * @param  {String} status Text that denotes a build status
 * @return {String}        Unicode character that maps to an icon in screwdriver icon font
 */
const icon = status =>
  STATUS_MAP[status] ? STATUS_MAP[status].icon : STATUS_MAP.UNKNOWN.icon;

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
 * Walks the graph to find siblings and set their positions
 * @method walkGraph
 * @param  {Object}  graph Raw graph definition
 * @param  {String}  start The job name to start from for this iteration
 * @param  {Number}  x     The column for this iteration
 * @param  {Array}   y     Accumulator of column depth
 */
const walkGraph = (graph, start, x, y) => {
  if (!y[x]) {
    y[x] = y[0] - 1;
  }
  const nodeNames = graph.edges.filter(e => e.src === start).map(e => e.dest);

  nodeNames.forEach(name => {
    const obj = node(graph.nodes, name);

    if (!obj.pos) {
      obj.pos = { x, y: y[x] };
      y[x] += 1;

      // walk if not yet visited
      walkGraph(graph, name, x + 1, y);
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
 * Determine if an node has destinations that have already been processed.
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
 * Clones and decorates an input graph datastructure into something that can be used to display
 * a custom directed graph
 * @method decorateGraph
 * @param  {Object}      inputGraph A directed graph representation { nodes: [], edges: [] }
 * @param  {Array|DS.PromiseArray}  [builds]     A list of build metadata
 * @param  {Array|DS.PromiseArray}  [jobs]       A list of job metadata
 * @param  {String}      [start]    Node name that indicates what started the graph
 * @return {Object}                 A graph representation with row/column coordinates for drawing, and meta information for scaling
 */
const decorateGraph = ({ inputGraph, builds, jobs, start }) => {
  // deep clone
  const graph = JSON.parse(JSON.stringify(inputGraph));
  const { nodes } = graph;
  const buildsAvailable =
    (Array.isArray(builds) || builds instanceof DS.PromiseArray) &&
    builds.length;
  const jobsAvailable =
    (Array.isArray(jobs) || jobs instanceof DS.PromiseArray) && jobs.length;
  const { edges } = graph;

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

      // Set the node position
      n.pos = { x: 0, y: y[0] };
      // increment by one for next root node
      y[0] += 1;
      // recursively walk the graph from root/ detached node
      walkGraph(graph, n.name, 1, y);
    }

    // Get job information
    const jobId = n.id;

    if (jobsAvailable) {
      const j = job(jobs, jobId);

      // eslint-disable-next-line no-nested-ternary
      n.isDisabled = j
        ? j.isDisabled === undefined
          ? false
          : j.isDisabled
        : false;

      // Set build status to disabled if job is disabled
      if (n.isDisabled) {
        const { state } = j;
        const stateWithCapitalization =
          state[0].toUpperCase() + state.substring(1).toLowerCase();
        const { stateChanger } = j;

        n.status = state;
        n.stateChangeMessage = stateChanger
          ? `${stateWithCapitalization} by ${stateChanger}`
          : stateWithCapitalization;
      }

      // Set manualStartEnabled on the node
      const annotations = j ? get(j, 'permutations.0.annotations') : null;

      if (annotations) {
        n.manualStartDisabled =
          'screwdriver.cd/manualStartEnabled' in annotations
            ? !annotations['screwdriver.cd/manualStartEnabled']
            : false;
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
      e.status = srcNode.status;
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

export {
  node,
  icon,
  decorateGraph,
  graphDepth,
  isRoot,
  isTrigger,
  subgraphFilter,
  removeBranch
};
