import Route from '@ember/routing/route';
import { later } from '@ember/runloop';

export default class PipelineEventsShowRoute extends Route {
  async setupController(controller, model) {
    super.setupController(controller, model);

    const { event_id: eventId } = this.paramsFor(this.routeName);
    const pipelineEventsController = this.controllerFor('pipeline.events');
    const desiredEvent = pipelineEventsController.events.findBy('id', eventId);

    if (!desiredEvent) {
      // load desiredEvent
      await this.store.findRecord('event', eventId);
    }

    later(() => {
      // scroll to highlighted event
      const scrollConfig = { behavior: 'smooth', block: 'center' };

      document.querySelector('.highlighted').scrollIntoView(scrollConfig);
    }, 5000);

    pipelineEventsController.set('selected', eventId);
  }
}
