import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PipelineEventsIndexRoute extends Route {
  @service router;

  redirect(model = {} /* , transition */) {
    const eventId = model.events.firstObject.id || 0;
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    if (eventId) {
      this.router.transitionTo('pipeline.events.show', pipelineId, eventId);
    }
  }
}
