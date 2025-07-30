import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  async model() {
    const pipeline = this.pipelinePageState.getPipeline();

    const latestEvent = pipeline.lastEventId
      ? await this.shuttle.fetchFromApi(
          'get',
          `/events/${pipeline.lastEventId}`
        )
      : null;

    return {
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
