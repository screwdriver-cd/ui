import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsIndexRoute extends Route {
  @service router;

  redirect(model = {} /* , transition */) {
    const eventId = model.events.firstObject.id || 0;
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');

    if (eventId) {
      this.router.transitionTo('v2.pipeline.events.show', pipelineId, eventId);
    }
  }
}
