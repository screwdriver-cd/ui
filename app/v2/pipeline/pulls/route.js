import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelinePullsRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    const stages = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/stages`
    );

    const triggers = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/triggers`
    );

    const pullRequestJobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pr`
    );

    return {
      userSettings,
      stages,
      triggers,
      pullRequestJobs
    };
  }
}
