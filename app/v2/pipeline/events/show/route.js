import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsShowRoute extends Route {
  @service shuttle;

  async model() {
    const eventId = this.paramsFor('v2.pipeline.events.show').event_id;
    const model = this.modelFor('v2.pipeline.events');
    const { latestCommitEvent } = model;

    let event = latestCommitEvent;

    if (eventId !== latestCommitEvent.id) {
      event = await this.shuttle.fetchFromApi('get', `/events/${eventId}`);
    }

    const events = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${model.pipeline.id}/events?page=1&count=20`
    );

    const builds = await this.shuttle.fetchFromApi(
      'get',
      `/events/${eventId}/builds?fetchSteps=false`
    );

    const jobs = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${model.pipeline.id}/jobs`
    );

    const stages = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${model.pipeline.id}/stages`
    );

    const triggers = await this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${model.pipeline.id}/triggers`
    );

    return {
      ...model,
      event,
      events,
      builds,
      jobs,
      stages,
      triggers
    };
  }
}
