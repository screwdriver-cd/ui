import Route from '@ember/routing/route';
import { later, scheduleOnce } from '@ember/runloop';
import { action } from '@ember/object';

export default class PipelineEventsShowRoute extends Route {
  eventId = undefined;

  hasScrolled = false;

  /**
   * scroll to highlighted event
   * @return
   */
  scrollToHighlightedEvent() {
    const scrollConfig = { behavior: 'smooth', block: 'center' };
    const highlightedEvent = document.querySelector('.highlighted');

    if (highlightedEvent) {
      highlightedEvent.scrollIntoView(scrollConfig);
      this.hasScrolled = true;
    }
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    const { event_id: eventId } = this.paramsFor(this.routeName);
    const pipelineEventsController = this.controllerFor('pipeline.events');
    const desiredEvent = pipelineEventsController.events.findBy('id', eventId);

    if (!desiredEvent) {
      await this.store.findRecord('event', eventId);
    }

    pipelineEventsController.set('selected', eventId);

    if (eventId !== this.eventId) {
      this.eventId = eventId;
      this.hasScrolled = false;
    }
  }

  @action
  didTransition() {
    if (!this.hasScrolled) {
      later(() => {
        scheduleOnce('afterRender', this, this.scrollToHighlightedEvent);
      }, 5000);
    }

    return true;
  }
}
