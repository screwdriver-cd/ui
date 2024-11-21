import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { getPrNumber, newestPrNumber } from './util';

export default class NewPipelinePullsRoute extends Route {
  @service shuttle;

  async model() {
    const model = this.modelFor('v2.pipeline');
    const pipelineId = model.pipeline.id;

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pipeline`
    );

    const stages = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/stages`
    );

    const triggers = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/triggers`
    );

    const pullRequestIds = new Set();

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/jobs?type=pr`)
      .then(prJobs => {
        prJobs.forEach(prJob => {
          pullRequestIds.add(getPrNumber(prJob));
        });
      });

    const newestPrNum = newestPrNumber(pullRequestIds);

    return {
      ...model,
      userSettings,
      jobs,
      stages,
      triggers,
      pullRequestIds,
      newestPrNum
    };
  }
}
