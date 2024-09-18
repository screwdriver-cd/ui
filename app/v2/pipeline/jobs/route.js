import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineJobsRoute extends Route {
  @service shuttle;

  async model() {
    const { pipeline } = this.modelFor('v2.pipeline');
    const pipelineId = pipeline.id;

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs`
    );

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    return {
      pipeline,
      jobs,
      userSettings
    };
  }
}
