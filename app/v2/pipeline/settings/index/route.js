import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsIndexRoute extends Route {
  @service('pipeline-page-state') pipelinePageState;

  @service('shuttle') shuttle;

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    if (this.pipelinePageState.getAdminUsers().length === 0) {
      await this.shuttle
        .fetchFromApi('get', `/pipelines/${pipelineId}/admins`)
        .then(adminUsers => {
          this.pipelinePageState.setAdminUsers(adminUsers);
        });
    }

    return {
      pipelineId
    };
  }
}
