import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineJobsRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pipeline`
    );

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    return {
      jobs,
      userSettings
    };
  }
}
