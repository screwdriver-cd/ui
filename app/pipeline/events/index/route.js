import Route from '@ember/routing/route';
import { getWithDefault } from '@ember/object';

export default class PipelineEventsIndexRoute extends Route {
  redirect(model = {} /* , transition */) {
    const eventId = getWithDefault(model, 'events.firstObject.id', 0);
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    if (eventId) {
      this.transitionTo('pipeline.events.show', pipelineId, eventId);
    }
  }
}
