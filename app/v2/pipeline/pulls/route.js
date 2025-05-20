import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelinePullsRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('pr-jobs') prJobs;

  activate() {
    this.pipelinePageState.setIsPr(true);
  }

  deactivate() {
    this.pipelinePageState.setIsPr(false);
  }

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/stages`)
      .then(stages => {
        this.pipelinePageState.setStages(stages);
      });

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/triggers`)
      .then(triggers => {
        this.pipelinePageState.setTriggers(triggers);
      });

    await this.prJobs.setPullRequestJobs();

    return {
      userSettings
    };
  }
}
