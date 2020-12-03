import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class PipelineEventsShowRoute extends Route {
  @service router;

  eventId = undefined;

  async setupController(controller, model) {
    super.setupController(controller, model);

    const { event_id: eventId } = this.paramsFor(this.routeName);
    const pipelineEventsController = this.controllerFor('pipeline.events');
    const desiredEvent = pipelineEventsController.events.findBy('id', eventId);

    if (!desiredEvent) {
      const event = await this.store.findRecord('event', eventId);

      pipelineEventsController.paginateEvents.pushObject(event);
    }

    pipelineEventsController.set('selected', eventId);

    if (eventId !== this.eventId) {
      this.eventId = eventId;
    }
  }

  @action
  error(/* error, transition */) {
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    this.router.transitionTo('pipeline', pipelineId);
  }
}
