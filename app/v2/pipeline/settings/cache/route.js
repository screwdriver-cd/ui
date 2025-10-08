import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsCacheRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  beforeModel() {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();
  }

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    if (this.pipelinePageState.getJobs().length === 0) {
      await this.shuttle
        .fetchFromApi('get', `/pipelines/${pipelineId}/jobs`)
        .then(jobs => {
          this.pipelinePageState.setJobs(jobs);
        });
    }

    return {
      pipelineId
    };
  }
}
