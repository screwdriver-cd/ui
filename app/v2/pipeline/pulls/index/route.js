import Route from '@ember/routing/route';
import { service } from '@ember/service';
import {
  getPrNumbers,
  newestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

export default class V2PipelinePullsIndexRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('pr-jobs') prJobs;

  async model() {
    const model = this.modelFor('v2.pipeline.pulls');
    const pullRequestJobs = this.prJobs.getPullRequestJobs();

    let event;

    if (pullRequestJobs.length > 0) {
      const pullRequestIds = getPrNumbers(pullRequestJobs);
      const newestPrNum = newestPrNumber(pullRequestIds);

      event = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines/${this.pipelinePageState.getPipelineId()}/events?prNum=${newestPrNum}`
        )
        .then(events => {
          return events[0];
        });
    }

    return {
      ...model,
      event
    };
  }

  afterModel(model) {
    const { event } = model;

    if (event) {
      const transition = this.replaceWith('v2.pipeline.pulls.show', event.id);

      transition.data = {
        event
      };
    }
  }
}
