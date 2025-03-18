import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { NotFoundError } from 'ember-ajax/errors';

export default class NewPipelineEventsShowRoute extends Route {
  @service shuttle;

  @service pipelinePageState;

  async model(params, transition) {
    const eventId = params.event_id;
    const model = this.modelFor('v2.pipeline.events');
    const pipelineId = this.pipelinePageState.getPipelineId();

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

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/triggers`)
      .then(triggers => {
        this.pipelinePageState.setTriggers(triggers);
      });

    return {
      userSettings: model.userSettings,
      event,
      latestEvent,
      jobs,
      stages,
      invalidEvent: event === null
    };
  }
}
