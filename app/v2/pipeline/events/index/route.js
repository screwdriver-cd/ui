import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model() {
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = this.pipelinePageState.getPipelineId();

    const latestEvent = await this.shuttle
      // TODO: Add the count=1 query parameter back in when the API bug is resolved -> https://github.com/screwdriver-cd/screwdriver/issues/3308
      .fetchFromApi('get', `/pipelines/${pipelineId}/events`)
      .then(events => {
        return events[0];
      });

    return {
      userSettings: model.userSettings,
      latestEvent
    };
  }

  afterModel(model) {
    const { latestEvent } = model;

    if (latestEvent) {
      const transition = this.replaceWith(
        'v2.pipeline.events.show',
        latestEvent.id
      );

      transition.data = {
        latestEvent
      };
    }
  }
}
