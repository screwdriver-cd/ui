import { get } from '@ember/object';
import DS from 'ember-data';

const STATUS_MAP = {
  SUCCESS: { icon: '\ue903' },
  STARTED_FROM: { icon: '\ue907' },
  RUNNING: { icon: '\ue905' },
  QUEUED: { icon: '\ue904' },
  ABORTED: { icon: '\ue900' },
  FAILURE: { icon: '\ue906' },
  DISABLED: { icon: '\ue902' },
  UNKNOWN: { icon: '\ue901' }
};

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
const build = (builds, jobId) => builds.find(b => b && `${get(b, 'jobId')}` === `${jobId}`);

/**
 * Find the icon to set as the text for a node
 * @method icon
 * @param  {String} status Text that denotes a build status
 * @return {String}        Unicode character that maps to an icon in screwdriver icon font
 */
const icon = status => (STATUS_MAP[status] ? STATUS_MAP[status].icon : STATUS_MAP.UNKNOWN.icon);

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
    dests.forEach((e) => {
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
  if (!y[x]) { y[x] = y[0] - 1; }
  const nodeNames = graph.edges.filter(e => e.src === start).map(e => e.dest);

  nodeNames.forEach((name) => {
    const obj = node(graph.nodes, name);

    if (!obj.pos) {
      obj.pos = { x, y: y[x] };
      y[x] += 1;
    }

    walkGraph(graph, name, x + 1, y);
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
 * Determine if an node has destinations that have already been processed.
 * This allows a graph's common root nodes to collapse instead of taking up multiple lines.
 * @method hasProcessedDest
 * @param  {Object}         graph The processed graph
 * @param  {String}         name  node name
 * @return {Boolean}              True if a destination of the node has already been processed
 */
const hasProcessedDest = (graph, name) => {
  const nodes = graph.edges.filter(edge => edge.src === name).map(edge => edge.dest);

  return nodes.some((n) => {
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
 * @param  {String}      [start]    Node name that indicates what started the graph
 * @return {Object}                 A graph representation with row/column coordinates for drawing, and meta information for scaling
 */
const decorateGraph = (inputGraph, builds, start) => {
  // simple clone
  const graph = JSON.parse(JSON.stringify(inputGraph));
  const nodes = graph.nodes;
  const buildsAvailable = (Array.isArray(builds) || builds instanceof DS.PromiseArray) &&
    get(builds, 'length');
  const edges = graph.edges;
  let y = [0]; // accumulator for column heights

  nodes.forEach((n) => {
    // Set root nodes on left
    if (isRoot(edges, n.name)) {
      if (!hasProcessedDest(graph, n.name)) {
        // find the next unused row
        let tmp = Math.max(...y);

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

    // get build information
    const jobId = get(n, 'id');

    if (buildsAvailable && jobId) {
      const b = build(builds, jobId);

      // Add build information to node
      if (b) {
        n.status = get(b, 'status');
        n.buildId = get(b, 'id');
      }
    }

    // Set a status on the trigger node (if it starts with ~)
    if (n.name === start && /^~/.test(n.name)) {
      n.status = 'STARTED_FROM';
    }
  });

  // Decorate edges with positions and status
  edges.forEach((e) => {
    const srcNode = node(nodes, e.src);
    const destNode = node(nodes, e.dest);

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

export default { node, icon, decorateGraph, graphDepth, isRoot };
