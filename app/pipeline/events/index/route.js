import { get } from '@ember/object';
import Route from '@ember/routing/route';

export default class PipelineEventsIndexRoute extends Route {
  redirect(model = {} /* , transition */) {
    const eventId =
      get(model, 'events.firstObject.id') === undefined
        ? 0
        : get(model, 'events.firstObject.id');
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    if (eventId) {
      this.transitionTo('pipeline.events.show', pipelineId, eventId);
    }
  }
}
