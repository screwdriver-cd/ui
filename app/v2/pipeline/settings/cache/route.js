import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsCacheRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  async model() {
    if (this.pipelinePageState.getJobs().length === 0) {
      const pipelineId = this.pipelinePageState.getPipelineId();

      await this.shuttle
        .fetchFromApi('get', `/pipelines/${pipelineId}/jobs`)
        .then(jobs => {
          this.pipelinePageState.setJobs(jobs);
        });
    }
  }
}
