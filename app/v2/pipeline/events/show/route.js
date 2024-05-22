import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsShowRoute extends Route {
  @service
  store;

  setupController() {
    const { event_id: eventId } = this.paramsFor('v2.pipeline.events.show');
    const eventsController = this.controllerFor('v2.pipeline.events');

    eventsController.set('selectedEventId', eventId);
  }
}
