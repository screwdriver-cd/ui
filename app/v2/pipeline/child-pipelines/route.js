import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineChildPipelinesRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  beforeModel() {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();
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
