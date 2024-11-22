import Route from '@ember/routing/route';
import {
  getPrNumbers,
  newestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

export default class V2PipelinePullsIndexRoute extends Route {
  model() {
    return this.modelFor('v2.pipeline.pulls');
  }

  afterModel(model) {
    const { pullRequestJobs } = model;

    if (pullRequestJobs.length > 0) {
      const pullRequestIds = getPrNumbers(pullRequestJobs);
      const newestPrNum = newestPrNumber(pullRequestIds);

      this.replaceWith('v2.pipeline.pulls.show', newestPrNum);
    }
  }
}
