import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsIndexRoute extends Route {
  @service('pipeline-page-state') pipelinePageState;

  model() {
    return {
      pipelineId: this.pipelinePageState.getPipelineId()
    };
  }
}
