import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineJobsRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('settings') settings;

  beforeModel() {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();
  }

  async model() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/jobs?type=pipeline`)
      .then(jobs => {
        this.pipelinePageState.setJobs(jobs);
      });

    if (!this.settings.getSettings()) {
      await this.settings.fetchSettings();
    }

    return {
      pipelineId
    };
  }
}
