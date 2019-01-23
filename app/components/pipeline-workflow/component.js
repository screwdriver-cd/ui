import Component from '@ember/component';
import { get, computed, set, setProperties } from '@ember/object';
import { all, reject } from 'rsvp';
import { isRoot } from 'screwdriver-ui/utils/graph-tools';

export default Component.extend({
  classNames: ['pipelineWorkflow'],
  showTooltip: false,
  graph: computed('workflowGraph', {
    get() {
      const jobs = get(this, 'jobs');
      const fetchBuilds = [];
      const graph = get(this, 'workflowGraph');

      // Hack to make page display stuff when a workflow is not provided
      if (!graph) {
        return reject(new Error('No workflow graph provided'));
      }

      // Preload the builds for the jobs
      jobs.forEach((j) => {
        const jobName = get(j, 'name');

        const node = graph.nodes.find(n => n.name === jobName);

        // push the job id into the graph
        if (node) {
          node.id = get(j, 'id');
          fetchBuilds.push(get(j, 'builds'));
        }
      });

      return all(fetchBuilds).then(() => {
        const builds = [];

        // preload the "last build" data for each job for the graph to consume
        jobs.forEach(j => builds.push(get(j, 'lastBuild')));

        // set values to consume from templates
        set(this, 'builds', builds);
        set(this, 'directedGraph', graph);

        return graph;
      });
    }
  }),
  displayRestartButton: computed.alias('authenticated'),

  init() {
    this._super(...arguments);
    set(this, 'builds', []);
  },
  didUpdateAttrs() {
    this._super(...arguments);
    // hide graph tooltip when event changes
    set(this, 'showTooltip', false);
  },
  actions: {
    graphClicked(job, mouseevent, sizes) {
      const edges = get(this, 'directedGraph.edges');
      let isRootNode = true;
      let isTrigger = job ? /^~/.test(job.name) : false;

      // Find root nodes to determine position of tooltip
      if (job && edges && !/^~/.test(job.name)) {
        isRootNode = isRoot(edges, job.name);
      }

      // hide tooltip when not clicking on an active job node or root node
      if (!job || isTrigger) {
        this.set('showTooltip', false);

        return false;
      }

      setProperties(this, {
        showTooltip: true,
        // detached jobs should show tooltip on the left
        showTooltipPosition: isRootNode ? 'left' : 'center',
        tooltipData: {
          job,
          mouseevent,
          sizes
        }
      });

      return false;
    },
    confirmStartBuild() {
      set(this, 'isShowingModal', true);
      set(this, 'showTooltip', false);
    },
    cancelStartBuild() {
      set(this, 'isShowingModal', false);
    },
    startDetachedBuild() {
      set(this, 'isShowingModal', false);
      get(this, 'startDetachedBuild')(get(this, 'tooltipData.job'));
    }
  }
});
