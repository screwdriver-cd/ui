/* global d3 */
import Component from '@ember/component';
import { set, getWithDefault, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { icon, decorateGraph, subgraphFilter } from 'screwdriver-ui/utils/graph-tools';
import ENV from 'screwdriver-ui/config/environment';

/**
 * remove branch of given node and its children
 * @param  {Node} node     Given node
 * @param  {Graph} graph   Given graph
 * @return {undefined}     Removal operation is in-place
 */
function removeBranch(node, graph) {
  if (node && node.name) {
    const inEdges = graph.edges.filter(edge => edge.dest === node.name).length;

    // remove node if it only has 1 edge
    if (inEdges === 0) {
      // keep a copy of edges to aid in-place edge removal
      const edges = graph.edges.slice(0);

      edges.forEach(edge => {
        if (edge.src === node.name) {
          const nodeToBeRemoved = graph.nodes.findBy('name', edge.dest);

          graph.edges.removeObject(edge);

          removeBranch(nodeToBeRemoved, graph);
        }
      });

      graph.nodes.removeObject(node);
    }
  }
}

export default Component.extend({
  shuttle: service(),
  store: service(),
  router: service(),
  classNameBindings: ['minified'],
  displayJobNames: true,
  showPRJobs: true,
  graph: { nodes: [], edges: [] },
  decoratedGraph: computed(
    'showPRJobs',
    'showDownstreamTriggers',
    'workflowGraph',
    'startFrom',
    'minified',
    'builds.@each.{status,id}',
    'jobs.@each.{isDisabled,state,stateChanger}',
    'completeWorkflowGraph',
    {
      get() {
        const showDownstreamTriggers = getWithDefault(this, 'showDownstreamTriggers', false);
        const builds = getWithDefault(this, 'builds', []);
        const { startFrom } = this;
        const jobs = getWithDefault(this, 'jobs', []);
        const workflowGraph = getWithDefault(this, 'workflowGraph', { nodes: [], edges: [] });
        const completeGraph = getWithDefault(this, 'completeWorkflowGraph', {
          nodes: [],
          edges: []
        });

        let graph = showDownstreamTriggers ? completeGraph : workflowGraph;

        // only remove node if it is not a source node
        const endNodes = graph.nodes.filter(node => {
          if (node.name.startsWith('sd@')) {
            // check if an edge has this node as source
            if (graph.edges.filter(edge => edge.src === node.name).length <= 0) {
              return true;
            }
          }

          return false;
        });

        // remove duplicate dangling trigger jobs from graph
        if (endNodes.length) {
          graph.nodes.removeObjects(endNodes);
          endNodes.forEach(endNode => {
            const endEdges = graph.edges.filter(edge => edge.dest === endNode.name);

            graph.edges.removeObjects(endEdges);
          });
        }

        // remove jobs that starts from ~pr
        if (!this.showPRJobs) {
          const prNode = graph.nodes.findBy('name', '~pr');

          removeBranch(prNode, graph);
        }

        set(this, 'graph', graph);

        return decorateGraph({
          inputGraph: this.minified ? subgraphFilter(graph, startFrom) : graph,
          builds,
          jobs,
          start: startFrom
        });
      }
    }
  ),
  elementSizes: computed('minified', {
    get() {
      if (this.minified) {
        return {
          ICON_SIZE: 12,
          TITLE_SIZE: 0,
          ARROWHEAD: 2
        };
      }

      return {
        ICON_SIZE: 36,
        TITLE_SIZE: 12,
        ARROWHEAD: 6
      };
    }
  }),
  didInsertElement() {
    this._super(...arguments);
    this.draw(this.decoratedGraph);

    set(this, 'lastGraph', this.get('graph'));
  },
  // Listen for changes to workflow and update graph accordingly.
  didReceiveAttrs() {
    this._super(...arguments);

    this.doRedraw(this.get('decoratedGraph'));
  },
  doRedraw(decoratedGraph) {
    const lg = this.lastGraph;
    const wg = this.get('graph');

    if (!this.graphNode) {
      return;
    }

    // redraw anyways when graph changes
    if (lg !== wg) {
      this.graphNode.remove();

      this.draw(decoratedGraph);
      set(this, 'lastGraph', wg);
    } else {
      this.redraw(decoratedGraph.graph);
    }
  },
  actions: {
    buildClicked(job) {
      const fn = this.graphClicked;

      if (!this.minified && typeof fn === 'function') {
        fn(job, d3.event, this.elementSizes);
      }
    }
  },
  redraw(data) {
    if (!data) return;
    const el = d3.select(this.element);

    data.nodes.forEach(node => {
      const n = el.select(`g.graph-node[data-job="${node.name}"]`);

      if (n) {
        const txt = n.select('text');

        txt.text(icon(node.status));
        n.attr('class', `graph-node${node.status ? ` build-${node.status.toLowerCase()}` : ''}`);
      }
    });
  },
  async draw(data) {
    const self = this;

    let desiredJobNameLength = ENV.APP.MINIMUM_JOBNAME_LENGTH;

    const pipelineId = this.get('pipeline.id');
    const pipelinePreference = await this.store.peekAll('preference/pipeline').findBy('id', pipelineId);

    if (pipelinePreference) {
      const { displayJobNameLength } = pipelinePreference;

      if (displayJobNameLength > desiredJobNameLength) {
        desiredJobNameLength = displayJobNameLength;
      }
    }

    const MAX_LENGTH = Math.min(
      data.nodes.reduce((max, cur) => Math.max(cur.name.length, max), 0),
      desiredJobNameLength
    );
    const { ICON_SIZE, TITLE_SIZE, ARROWHEAD } = this.elementSizes;

    let X_WIDTH = ICON_SIZE * 2;

    // When displaying job names use estimate of 7 per character
    if (TITLE_SIZE && this.displayJobNames) {
      X_WIDTH = Math.max(X_WIDTH, MAX_LENGTH * 7);
    }
    // Adjustable spacing between nodes
    const Y_SPACING = ICON_SIZE;
    const EDGE_GAP = Math.floor(ICON_SIZE / 6);

    // Calculate the canvas size based on amount of content, or override with user-defined size
    const w = this.width || data.meta.width * X_WIDTH;
    const h = this.height || data.meta.height * ICON_SIZE + data.meta.height * Y_SPACING;

    // Add the SVG element
    const svg = d3
      .select(this.element)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .on(
        'click.graph-node:not',
        e => {
          this.send('buildClicked', e);
        },
        true
      );

    this.set('graphNode', svg);

    const calcXCenter = pos => X_WIDTH / 2 + pos * X_WIDTH;

    // Calculate the start/end point of a line
    const calcPos = (pos, spacer) => (pos + 1) * ICON_SIZE + (pos * spacer - ICON_SIZE / 2);

    const isSkipped = getWithDefault(this, 'isSkipped', false);

    // edges
    svg.selectAll('link')
      .data(data.edges)
      .enter()
      .append('path')
      .attr('class', d =>
        isSkipped
          ? 'graph-edge build-skipped'
          : `graph-edge ${d.status ? `build-${d.status.toLowerCase()}` : ''}`
      )
      .attr('stroke-dasharray', d => (!d.status || isSkipped ? 5 : 500))
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('d', d => {
        const path = d3.path();
        const startX = calcXCenter(d.from.x) + ICON_SIZE / 2 + EDGE_GAP;
        const startY = calcPos(d.from.y, Y_SPACING);
        const endX = calcXCenter(d.to.x) - ICON_SIZE / 2 - EDGE_GAP;
        const endY = calcPos(d.to.y, Y_SPACING);

        path.moveTo(startX, startY);
        // curvy line
        path.bezierCurveTo(endX, startY, endX - X_WIDTH / 2, endY, endX, endY);
        // arrowhead
        path.lineTo(endX - ARROWHEAD, endY - ARROWHEAD);
        path.moveTo(endX, endY);
        path.lineTo(endX - ARROWHEAD, endY + ARROWHEAD);

        return path;
      });

    // Jobs Icons
    svg.selectAll('jobs')
      .data(data.nodes)
      .enter()
    // for each element in data array - do the following
    // create a group element to animate
      .append('g')
      .attr('class', d => {
        if (isSkipped && d.status === 'STARTED_FROM') {
          return 'graph-node build-skipped';
        }

        return `graph-node${d.status ? ` build-${d.status.toLowerCase()}` : ''}`;
      })
      .attr('data-job', d => d.name)
    // create the icon graphic
      .insert('text')
      .text(d => {
        if (isSkipped && d.status === 'STARTED_FROM') {
          return icon('SKIPPED');
        }

        return icon(d.status);
      })
      .attr('font-size', `${ICON_SIZE}px`)
      .style('text-anchor', 'middle')
      .attr('x', d => calcXCenter(d.pos.x))
      .attr('y', d => (d.pos.y + 1) * ICON_SIZE + d.pos.y * Y_SPACING)
      .on('click', e => {
        this.send('buildClicked', e);
      })
    // add a tooltip
      .insert('title')
      .text(d => (d.status ? `${d.name} - ${d.status}` : d.name));

    let jobFound = false;

    // Job Names
    if (TITLE_SIZE && this.displayJobNames) {
      svg.selectAll('jobslabels')
        .data(data.nodes)
        .enter()
        .append('text')
        .text(d => {
          const displayName = d.displayName !== undefined ? d.displayName : d.name;

          return displayName.length >= desiredJobNameLength
            ? `${displayName.substr(0, 8)}...${displayName.substr(-8)}`
            : displayName;
        })
        .attr('class', d => {
          if (!self.minified && d.id === parseInt(self.jobId, 10)) {
            jobFound = true;

            return 'graph-label selected-job';
          }

          return 'graph-label';
        })
        .attr('font-size', `${TITLE_SIZE}px`)
        .style('text-anchor', 'middle')
        .attr('x', d => calcXCenter(d.pos.x))
        .attr('y', d => (d.pos.y + 1) * ICON_SIZE + d.pos.y * Y_SPACING + TITLE_SIZE)
        .insert('title')
        .text(d => d.name);
    }
    if (jobFound && !this.scrolledToSelectedJob) {
      this.element.querySelectorAll('svg > .selected-job')[0].scrollIntoView();
      this.scrolledToSelectedJob = true;
    }
  }
});
