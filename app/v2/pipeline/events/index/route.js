import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'ember-ajax/errors';

export default class NewPipelineEventsIndexRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  async model() {
    const pipeline = this.pipelinePageState.getPipeline();

    const latestEvent = pipeline.lastEventId
      ? await this.shuttle
          .fetchFromApi('get', `/events/${pipeline.lastEventId}`)
          .catch(err => {
            if (err instanceof NotFoundError) {
              return null;
            }
            throw err;
          })
      : null;

    return {
      pipelineId: pipeline.id,
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
