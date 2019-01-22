/* global d3 */
import Component from '@ember/component';
import { get, set, getWithDefault, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import graphTools from 'screwdriver-ui/utils/graph-tools';

const { icon, decorateGraph } = graphTools;

export default Component.extend({
  router: service(),
  classNameBindings: ['minified'],
  displayJobNames: true,
  decoratedGraph: computed('workflowGraph', 'builds.[]', 'jobs.[]', 'startFrom', {
    get() {
      const graph = getWithDefault(this, 'workflowGraph', { nodes: [], edges: [] });
      const builds = getWithDefault(this, 'builds', []);
      const jobs = getWithDefault(this, 'jobs', []);
      const startFrom = getWithDefault(this, 'startFrom', null);

      return decorateGraph({ inputGraph: graph, builds, jobs, start: startFrom });
    }
  }),
  elementSizes: computed('minified', {
    get() {
      if (get(this, 'minified')) {
        return {
          ICON_SIZE: 12,
          TITLE_SIZE: 0,
          ARROWHEAD: 2
        };
      }

      return {
        ICON_SIZE: 28,
        TITLE_SIZE: 10,
        ARROWHEAD: 4
      };
    }
  }),
  didInsertElement() {
    this._super(...arguments);
    this.draw();

    set(this, 'lastGraph', get(this, 'workflowGraph'));
  },
  // Listen for changes to workflow and update graph accordingly.
  didUpdateAttrs() {
    this._super(...arguments);

    const lg = get(this, 'lastGraph');
    const wg = get(this, 'workflowGraph');

    // redraw anyways when graph changes
    if (lg !== wg) {
      get(this, 'graphNode').remove();

      this.draw();
      set(this, 'lastGraph', wg);
    } else {
      this.redraw();
    }
  },
  actions: {
    buildClicked(job) {
      const fn = get(this, 'graphClicked');

      if (!get(this, 'minified') && typeof fn === 'function') {
        fn(job, d3.event, get(this, 'elementSizes'));
      }
    }
  },
  redraw() {
    const data = get(this, 'decoratedGraph');
    const el = d3.select(get(this, 'element'));

    data.nodes.forEach((node) => {
      const n = el.select(`g.graph-node[data-job="${node.name}"]`);

      if (n) {
        const txt = n.select('text');

        txt.text(icon(node.status));
        n.attr('class',
          `graph-node${node.status ? ` build-${node.status.toLowerCase()}` : ''}`
        );
      }
    });
  },
  draw() {
    const data = get(this, 'decoratedGraph');
    const MAX_DISPLAY_NAME = 20;
    const MAX_LENGTH = Math.min(data.nodes.reduce((max, cur) =>
      Math.max(cur.name.length, max), 0), MAX_DISPLAY_NAME);
    const { ICON_SIZE, TITLE_SIZE, ARROWHEAD } = get(this, 'elementSizes');
    let X_WIDTH = ICON_SIZE * 2;

    // When displaying job names use estimate of 5.00 per character
    if (TITLE_SIZE && get(this, 'displayJobNames')) {
      X_WIDTH = Math.max(X_WIDTH, MAX_LENGTH * 5.00);
    }
    // Adjustable spacing between nodes
    const Y_SPACING = ICON_SIZE;
    const EDGE_GAP = Math.floor(ICON_SIZE / 6);

    // Calculate the canvas size based on amount of content, or override with user-defined size
    const w = get(this, 'width') || (data.meta.width * X_WIDTH);
    const h = get(this, 'height') ||
      ((data.meta.height * ICON_SIZE) + (data.meta.height * Y_SPACING));

    // Add the SVG element
    const svg = d3.select(get(this, 'element'))
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .on('click.graph-node:not', (e) => {
        this.send('buildClicked', e);
      }, true);

    this.set('graphNode', svg);

    const calcXCenter = pos => ((X_WIDTH / 2) + (pos * X_WIDTH));

    // Calculate the start/end point of a line
    const calcPos = (pos, spacer) =>
      ((pos + 1) * ICON_SIZE) + ((pos * spacer) - (ICON_SIZE / 2));

    // edges
    svg.selectAll('link')
      .data(data.edges)
      .enter()
      .append('path')
      .attr('class', d => `graph-edge ${d.status ? `build-${d.status.toLowerCase()}` : ''}`)
      .attr('stroke-dasharray', d => (!d.status ? 5 : 500))
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('d', (d) => {
        const path = d3.path();
        const startX = calcXCenter(d.from.x) + (ICON_SIZE / 2) + EDGE_GAP;
        const startY = calcPos(d.from.y, Y_SPACING);
        const endX = calcXCenter(d.to.x) - (ICON_SIZE / 2) - EDGE_GAP;
        const endY = calcPos(d.to.y, Y_SPACING);

        path.moveTo(startX, startY);
        // curvy line
        path.bezierCurveTo(endX, startY, endX - (X_WIDTH / 2), endY, endX, endY);
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
      .attr('class',
        d => `graph-node${d.status ? ` build-${d.status.toLowerCase()}` : ''}`
      )
      .attr('data-job', d => d.name)
      // create the icon graphic
      .insert('text')
      .text(d => icon(d.status))
      .attr('font-size', `${ICON_SIZE}px`)
      .style('text-anchor', 'middle')
      .attr('x', d => calcXCenter(d.pos.x))
      .attr('y', d => ((d.pos.y + 1) * ICON_SIZE) + (d.pos.y * Y_SPACING))
      .on('click', (e) => {
        this.send('buildClicked', e);
      })
      // add a tooltip
      .insert('title')
      .text(d => d.status);

    // Job Names
    if (TITLE_SIZE && get(this, 'displayJobNames')) {
      svg.selectAll('jobslabels')
        .data(data.nodes)
        .enter()
        .append('text')
        .text(d => (d.name.length >= MAX_DISPLAY_NAME ?
          `${d.name.substr(0, 8)}...${d.name.substr(-8)}` : d.name))
        .attr('class', 'graph-label')
        .attr('font-size', `${TITLE_SIZE}px`)
        .style('text-anchor', 'middle')
        .attr('x', d => calcXCenter(d.pos.x))
        .attr('y', d => ((d.pos.y + 1) * ICON_SIZE) + (d.pos.y * Y_SPACING) + TITLE_SIZE)
        .insert('title')
        .text(d => d.name);
    }
  }
});
