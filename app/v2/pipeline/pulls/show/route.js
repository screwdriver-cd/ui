import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelinePullsShowRoute extends Route {
  @service shuttle;

  async model(params) {
    const model = this.modelFor('v2.pipeline.pulls');
    const prNum = parseInt(params.pull_request_number, 10);

    let latestEvent;

    let event;

    if (model.pullRequestIds.has(prNum)) {
      event = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines/${model.pipeline.id}/events?prNum=${prNum}`
        )
        .then(events => {
          return events[0];
        });
      latestEvent = event;
    } else {
      latestEvent = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines/${model.pipeline.id}/events?prNum=${model.newestPrNum}`
        )
        .then(events => {
          return events[0];
        });
    }

    return {
      ...model,
      event,
      latestEvent,
      invalidEvent: event === undefined
    };
  }
}
