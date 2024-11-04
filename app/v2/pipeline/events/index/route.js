import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'ember-ajax/errors';

export default class NewPipelineEventsIndexRoute extends Route {
  @service shuttle;

  async model() {
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = model.pipeline.id;

    const latestCommitEvent = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/latestCommitEvent`)
      .then(event => {
        return event;
      })
      .catch(err => {
        if (err instanceof NotFoundError) {
          return null;
        }

        return undefined;
      });

    return { ...model, latestCommitEvent };
  }

  afterModel(model) {
    const { latestCommitEvent } = model;

    if (latestCommitEvent) {
      const transition = this.replaceWith(
        'v2.pipeline.events.show',
        latestCommitEvent.id
      );

      transition.data = {
        latestCommitEvent
      };
    }
  }
}
