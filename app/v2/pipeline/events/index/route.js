import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model() {
    const model = this.modelFor('v2.pipeline.events');
    const pipeline = this.pipelinePageState.getPipeline();

    const latestEvent = pipeline.lastEventId
      ? await this.shuttle.fetchFromApi(
          'get',
          `/events/${pipeline.lastEventId}`
        )
      : null;

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
