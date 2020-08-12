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
    console.log('scrollToHighlightedEvent');
    const scrollConfig = { behavior: 'smooth', block: 'center' };
    const hightedEvent = document.querySelector('.highlighted');

    if (hightedEvent) {
      hightedEvent.scrollIntoView(scrollConfig);
      this.hasScrolled = true;
    }
  }

  async setupController(controller, model) {
    super.setupController(controller, model);
    console.log('setupController');

    const { event_id: eventId } = this.paramsFor(this.routeName);
    const pipelineEventsController = this.controllerFor('pipeline.events');
    const desiredEvent = pipelineEventsController.events.findBy('id', eventId);

    if (!desiredEvent) {
      // load desiredEvent
      await this.store.findRecord('event', eventId);
    }

    pipelineEventsController.set('selected', eventId);

    if (eventId !== this.eventId) {
      this.eventId = eventId;
      this.hasScrolled = false;
    }
  }

  // @action
  // activate() {
  //   console.log('activate');
  //   later(() => {
  //     console.log('scheduleOnce');
  //     scheduleOnce('afterRender', this, this.scrollToHighlightedEvent);
  //   }, 50000);
  // }

  @action
  didTransition() {
    console.log(this.routeName, 'didTransition');
    if (!this.hasScrolled) {
      later(() => {
        console.log('scheduleOnce');
        scheduleOnce('afterRender', this, this.scrollToHighlightedEvent);
      }, 5000);
    }

    return true;
  }
}
