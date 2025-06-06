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
            const latestEventId =
              this.pipelinePageState.getPipeline().lastEventId;

            latestEvent = await this.shuttle.fetchFromApi(
              'get',
              `/events/${latestEventId}`
            );

            return null;
          }

          return undefined;
        });
    }

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/jobs?type=pipeline`)
      .then(jobs => {
        this.pipelinePageState.setJobs(jobs);
      });

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/stages`)
      .then(stages => {
        this.pipelinePageState.setStages(stages);
      });

    await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/triggers`)
      .then(triggers => {
        this.pipelinePageState.setTriggers(triggers);
      });

    return {
      userSettings: model.userSettings,
      event,
      latestEvent,
      invalidEvent: event === null
    };
  }
}
