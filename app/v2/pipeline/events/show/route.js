import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'ember-ajax/errors';

export default class NewPipelineEventsShowRoute extends Route {
  @service shuttle;

  async model(params, transition) {
    const eventId = params.event_id;
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = model.pipeline.id;

    let latestEvent;

    let event;

    if (transition.data.latestEvent) {
      event = transition.data.latestEvent;
      latestEvent = event;
    } else {
      event = await this.shuttle
        .fetchFromApi('get', `/events/${eventId}`)
        .catch(async err => {
          if (err instanceof NotFoundError) {
            latestEvent = await this.shuttle
              .fetchFromApi('get', `/pipelines/${pipelineId}/events?count=1`)
              .then(events => {
                return events[0];
              });

            return null;
          }

          return undefined;
        });
    }

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/jobs?type=pipeline`
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
      latestEvent,
      jobs,
      stages,
      triggers,
      invalidEvent: event === null
    };
  }
}
