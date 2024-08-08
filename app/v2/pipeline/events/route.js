import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service shuttle;

  async model() {
    const model = this.modelFor('v2.pipeline');
    const pipelineId = this.paramsFor('v2.pipeline').pipeline_id;

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    const latestCommitEvent = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/latestCommitEvent`
    );

    return {
      ...model,
      userSettings,
      latestCommitEvent
    };
  }
}
