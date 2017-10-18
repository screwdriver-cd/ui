import Component from '@ember/component';
import { get, computed, set } from '@ember/object';
import { all, reject } from 'rsvp';

export default Component.extend({
  classNames: ['pipelineWorkflow'],
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
        set(this, 'visGraph', graph);

        return graph;
      });
    }
  }),

  init() {
    this._super(...arguments);
    set(this, 'builds', []);
  }
});
