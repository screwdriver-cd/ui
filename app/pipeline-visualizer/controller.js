import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  pipelines: [],
  session: service(),
  shuttle: service(),

  actions: {
    selectPipeline(pipeline) {
      this.set('pipeline', pipeline);
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
