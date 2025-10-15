import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSecretsIndexRoute extends Route {
  @service('pipeline-page-state') pipelinePageState;

  async beforeModel() {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();
  }

  model() {
    return {
      pipelineId: this.pipelinePageState.getPipelineId()
    };
  }
}
