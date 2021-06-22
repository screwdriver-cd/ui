import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';
import { getWithDefault } from '@ember/object';
import { all } from 'rsvp';

function isExternalTrigger(jobName) {
  return /^~?sd@/.test(jobName);
}

export default Controller.extend({
  session: service(),
  store: service(),
  shuttle: service(),
  pipelines: [],
  selectedPipeline: undefined,
  connectedPipelines: [],
  selectedConnectedPipeline: undefined,

  async extractConnectedPipelines(pipeline) {
    console.log('extractConnectedPipelines', pipeline);
    let upstreams = new Set();
    let downstreams = new Set();

    const edges = getWithDefault(pipeline, 'workflowGraph.edges', []);

    edges.forEach(e => {
      if (isExternalTrigger(e.src)) {
        upstreams.add(e.src);
      }
      if (isExternalTrigger(e.dest)) {
        downstreams.add(e.dest);
      }
    });

    const connectedJobs = Array.from(upstreams).concat(Array.from(downstreams));
    let connectedPipelines = [];

    try {
      const connectedPipelinesPromises = connectedJobs.map((connectedJobName) => {
        const pipelineWithJobName = connectedJobName.split('@')[1];
        const pipelineId = pipelineWithJobName.split(':')[0];

        // return this.shuttle.getLatestCommitEvent(pipelineId);
        return this.store.findRecord('pipeline', pipelineId);
      });

      connectedPipelines = await all(connectedPipelinesPromises);
    } catch (e) {

    } finally {
      console.log('connectedPipelines', connectedPipelines);

      return connectedPipelines;
    }
  },

  actions: {
    async selectPipeline(selectedPipeline) {
      const connectedPipelines = await this.extractConnectedPipelines(selectedPipeline);

      connectedPipelines.unshiftObject(selectedPipeline);

      this.setProperties({
        selectedPipeline,
        selectedConnectedPipeline: selectedPipeline,
        connectedPipelines
      });
    },

    selectConnectedPipeline(selectedConnectedPipeline) {
      this.set('selectedConnectedPipeline', selectedConnectedPipeline);
    },

    async searchPipeline(pipelineName) {
      console.log('pipelineName', pipelineName);

      const pipelines = await this.shuttle.searchPipelines(pipelineName);

      console.log('pipelines', pipelines);

      this.set('pipelines', pipelines);

      return pipelines;
    }
  }
});
