import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'ember-ajax/errors';

export default class NewPipelineEventsShowRoute extends Route {
  @service shuttle;

  async model(params, transition) {
    const eventId = params.event_id;
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = model.pipeline.id;

    let latestCommitEvent;

    let event;

    if (transition.data.latestCommitEvent) {
      event = transition.data.latestCommitEvent;
      latestCommitEvent = event;
    } else {
      event = await this.shuttle
        .fetchFromApi('get', `/events/${eventId}`)
        .catch(err => {
          if (err instanceof NotFoundError) {
            return null;
          }

          return undefined;
        });

      latestCommitEvent = await this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${pipelineId}/latestCommitEvent`
      );
    }

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs`
    );

    const stages = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/stages`
    );

    const triggers = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/triggers`
    );

    return {
      ...model,
      event,
      latestCommitEvent,
      jobs,
      stages,
      triggers,
      invalidEvent: event === null
    };
  }
}
