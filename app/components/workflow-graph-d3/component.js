/* global d3 */
import Component from '@ember/component';
import { get, getWithDefault, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import graphTools from 'screwdriver-ui/utils/graph-tools';

const { icon, decorateGraph } = graphTools;

export default Component.extend({
  router: service(),
  classNameBindings: ['minified'],
  displayJobNames: true,
  decoratedGraph: computed('workflowGraph', 'builds.[]', 'startFrom', {
    get() {
      const graph = getWithDefault(this, 'workflowGraph', { nodes: [], edges: [] });
      const builds = getWithDefault(this, 'builds', []);
      const startFrom = get(this, 'startFrom');

      return decorateGraph(graph, builds, startFrom);
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
    this.draw();
  },
  // Listen for changes to workflow and update graph accordingly.
  didUpdateAttrs() {
    this._super(...arguments);

    // TODO: is there a way to do this more gracefully?
    // remove the existing graph element
    this.$('svg').remove();
    // draw a new one
    this.draw();
  },
  actions: {
    buildClicked(job) {
      if (!job.buildId) {
        return false;
      }

      const fn = get(this, 'buildClicked');

      // Properly handle job if one is passed
      if (typeof fn === 'function') {
        return fn(job);
      }

      const router = get(this, 'router');

      // Backwards compatibilty - hack to make click route to build page
      let url = router.urlFor('pipeline.builds.build', job.buildId);

      if (job.name.startsWith('~sd@')) {
        const pipelineId = job.name.match(/^~sd@(\d+):([\w-]+)$/)[1];

        url = router.urlFor('pipeline.builds.build', pipelineId, job.buildId);
      }

      return router.transitionTo(url);
    }
  },
  draw() {
    const data = get(this, 'decoratedGraph');
    // TODO: actually scale drawing based on available space.
    const { ICON_SIZE, TITLE_SIZE, ARROWHEAD } = get(this, 'elementSizes');
    // Adjustable spacing between nodes
    const X_SPACING = ICON_SIZE;
    const Y_SPACING = ICON_SIZE;

    // Calculate the canvas size based on amount of content, or override with user-defined size
    const w = get(this, 'width') || ((data.meta.width * ICON_SIZE) + (data.meta.width * X_SPACING));
    const h = get(this, 'height') ||
      ((data.meta.height * ICON_SIZE) + (data.meta.height * Y_SPACING));

    // Add the SVG element
    const svg = d3.select(get(this, 'element'))
      .append('svg')
      .attr('width', w)
      .attr('height', h);

    // Jobs Icons
    svg.selectAll('jobs')
      .data(data.nodes)
      .enter()
      // for each element in data array - do the following
      // create a group element to animate
      .append('g')
      .attr('class', d => `graph-node${d.status ? ` build-${d.status.toLowerCase()}` : ''}`)
      // create the icon graphic
      .insert('text')
      .text(d => icon(d.status))
      .attr('font-size', `${ICON_SIZE}px`)
      .style('text-anchor', 'middle')
      .attr('x', d => ((d.pos.x + 1) * ICON_SIZE) + (d.pos.x * X_SPACING))
      .attr('y', d => ((d.pos.y + 1) * ICON_SIZE) + (d.pos.y * Y_SPACING))
      .on('click', (e) => {
        this.send('buildClicked', e);
      })
      // add a tooltip
      .insert('title')
      .text(d => d.name);

    // Job Names
    if (TITLE_SIZE && get(this, 'displayJobNames')) {
      svg.selectAll('jobslabels')
        .data(data.nodes)
        .enter()
        .append('text')
        .text(d => (d.name.length > 8 ? `${d.name.substr(0, 6)}...` : d.name))
        .attr('class', 'graph-label')
        .attr('font-size', `${TITLE_SIZE}px`)
        .style('text-anchor', 'middle')
        .attr('x', d => ((d.pos.x + 1) * ICON_SIZE) + (d.pos.x * X_SPACING))
        .attr('y', d => ((d.pos.y + 1) * ICON_SIZE) + (d.pos.y * Y_SPACING) + TITLE_SIZE);
    }

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
        const startX = calcPos(d.from.x, X_SPACING) + ICON_SIZE;
        const startY = calcPos(d.from.y, Y_SPACING);
        const endX = calcPos(d.to.x, X_SPACING);
        const endY = calcPos(d.to.y, Y_SPACING);

        path.moveTo(startX, startY);
        // curvy line
        path.bezierCurveTo(endX, startY, endX - X_SPACING, endY, endX, endY);
        // arrowhead
        path.lineTo(endX - ARROWHEAD, endY - ARROWHEAD);
        path.moveTo(endX, endY);
        path.lineTo(endX - ARROWHEAD, endY + ARROWHEAD);

        return path;
      });
  }
});
