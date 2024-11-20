import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service shuttle;

  async model() {
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = model.pipeline.id;

    const latestEvent = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/events?count=1`)
      .then(events => {
        return events[0];
      });

    return { ...model, latestEvent };
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
