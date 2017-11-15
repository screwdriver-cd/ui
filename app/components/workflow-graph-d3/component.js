/* global d3 */
import Component from '@ember/component';
import { get, getWithDefault, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import graphTools from 'screwdriver-ui/utils/graph-tools';

const { icon, decorateGraph } = graphTools;

export default Component.extend({
  router: service(),
  displayJobNames: true,
  decoratedGraph: computed('workflowGraph', 'builds.[]', 'startFrom', {
    get() {
      const graph = getWithDefault(this, 'workflowGraph', { nodes: [], edges: [] });
      const builds = getWithDefault(this, 'builds', []);
      const startFrom = get(this, 'startFrom');

      return decorateGraph(graph, builds, startFrom);
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
      console.log('click event');
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
    // Calculate the canvas size based on amount of content, or override with user-defined size
    const w = get(this, 'width') || data.meta.width * 60;
    const h = get(this, 'height') || data.meta.height * 60;

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
      .append('text')
      .text(d => icon(d.status))
      .attr('class', d => `graph-node ${d.status ? `build-${d.status.toLowerCase()}` : ''}`)
      .attr('font-family', 'denali-icons')
      .attr('font-size', '24px')
      .attr('x', d => ((d.pos.x * 50) + 25)) // FIX: OMG Magic numbers!
      .attr('y', d => ((d.pos.y * 50) + 45))
      .on('click', (e) => {
        console.log('raw click event');
        this.send('buildClicked', e);
      })
      // Add tooltip
      .append('title')
      .text(d => d.name);

    // Job Names
    if (get(this, 'displayJobNames')) {
      svg.selectAll('jobslabels')
        .data(data.nodes)
        .enter()
        .append('text')
        .text(d => (d.name.length > 8 ? `${d.name.substr(0, 6)}...` : d.name))
        .attr('font-family', 'Helvetica')
        .attr('font-size', '10px')
        .attr('x', d => ((d.pos.x * 50) + 25)) // FIX: OMG Magic numbers!
        .attr('y', d => ((d.pos.y * 50) + 55));
    }

    // edges
    svg.selectAll('.link')
      .data(data.edges)
      .enter()
      .append('path')
      .attr('class', d => `graph-edge ${d.status ? `build-${d.status.toLowerCase()}` : ''}`)
      .attr('stroke-dasharray', d => (!d.status ? 5 : 500))
      .attr('fill', 'transparent')
      .attr('d', (d) => {
        const path = d3.path();
        const startX = (d.from.x * 50) + 50; // FIX: OMG Magic numbers!
        const startY = (d.from.y * 50) + 35;
        const endX = (d.to.x * 50) + 25;
        const endY = (d.to.y * 50) + 35;

        path.moveTo(startX, startY);
        // curvy line
        path.bezierCurveTo(endX, startY, endX - 35, endY, endX, endY);
        // arrowhead
        path.lineTo(endX - 4, endY - 4);
        path.moveTo(endX, endY);
        path.lineTo(endX - 4, endY + 4);

        return path;
      });
  }
});
