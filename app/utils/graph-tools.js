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
 * Find the icon to set as the text for a node
 * @method icon
 * @param  {String} status Text that denotes a build status
 * @return {String}        Unicode character that maps to an icon in denali font
 */
const icon = status => (STATUS_MAP[status] ? STATUS_MAP[status].icon : STATUS_MAP.UNKNOWN.icon);

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
  const edges = graph.edges;
  const pos = { x: 0, y: 0 };
  const nextPos = { x: 1, y: 0 };
  let maxHeight = 1;

  // Decorate job status, and build info
  if ((Array.isArray(builds) || builds instanceof DS.PromiseArray) && get(builds, 'length')) {
    nodes.forEach((n) => {
      const build = builds.find(j => j && `${get(j, 'jobId')}` === `${n.id}`);

      if (build) {
        const status = get(build, 'status');

        if (status) {
          n.status = status;
        }

        n.buildId = get(build, 'id');
      }

      if (n.name === start) {
        n.status = 'STARTED_FROM';
      }
    });
  }

  // Calculate graph rows and columns with edges
  for (let i = 0; i < edges.length; i += 1) {
    const edge = edges[i];
    const nextEdge = edges[i + 1];
    const srcName = edge.src;
    const srcConfig = node(nodes, srcName);
    const destName = edge.dest;
    const destConfig = node(nodes, destName);

    // Set root node position
    if (!srcConfig.pos) {
      srcConfig.pos = Object.assign({}, pos);
    }

    // set "next" job position
    if (!destConfig.pos) {
      destConfig.pos = Object.assign({}, nextPos);
    }

    if (nextEdge) {
      // The next edge src is a sibling of this edge src
      if (edge.src !== nextEdge.src && edge.dest === nextEdge.dest) {
        pos.y += 1;
      }
      // The next edge destination is a sibling of this edge destination
      if (edge.src === nextEdge.src && edge.dest !== nextEdge.dest) {
        nextPos.y += 1;
      }
      maxHeight = Math.max(maxHeight, pos.y, nextPos.y);
      // We've gotten to the next step in the tree (increment x)
      if (edge.src !== nextEdge.src && edge.dest !== nextEdge.dest) {
        pos.x += 1;
        pos.y = 0;
        nextPos.x += 1;
        nextPos.y = 0;
      }
    }

    // copy in the src and dest job positions for drawing edge
    edge.from = srcConfig.pos;
    edge.to = destConfig.pos;

    // copy in the src job status for coloring edge
    if (srcConfig.status && srcConfig.status !== 'RUNNING') {
      edge.status = srcConfig.status;
    }
  }

  // Double check all nodes have positions (handle detached jobs with no edges)
  nodes.forEach((n) => {
    if (!n.pos) {
      maxHeight += 1;
      n.pos = { x: 0, y: maxHeight };
    }
  });

  // For auto-scaling canvas size
  graph.meta = { height: maxHeight + 1, width: nextPos.x + 1 };

  return graph;
};

export default { node, icon, decorateGraph };
