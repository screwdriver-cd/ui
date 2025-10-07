import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineChildPipelinesRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  beforeModel() {
    const pipeline = this.pipelinePageState.getPipeline();

    if (!pipeline.childPipelines) {
      this.replaceWith('v2.pipeline.events.index');
    }
  }

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    await this.shuttle
      .fetchFromApi('get', `/pipelines?configPipelineId=${pipelineId}`)
      .then(pipelines => {
        this.pipelinePageState.setChildPipelines(pipelines);
      });

    return {
      pipelineId
    };
  }
}
