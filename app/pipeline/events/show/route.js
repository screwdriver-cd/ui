import Route from '@ember/routing/route';
import { debounce, later } from '@ember/runloop';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class PipelineEventsShowRoute extends Route {
  @service router;

  eventId = undefined;

  hasScrolled = false;

  notFromSameRoute = true;

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

  redirect(model, transition) {
    if (
      transition.from?.name === 'pipeline.events.show' &&
      transition.to?.name === 'pipeline.events.show'
    ) {
      this.notFromSameRoute = false;
    } else {
      this.notFromSameRoute = true;
    }
  }

  @action
  didTransition() {
    if (!this.hasScrolled && this.notFromSameRoute) {
      later(() => {
        debounce(this, this.scrollToHighlightedEvent, 3000);
      }, 1000);
    }

    return true;
  }

  @action
  error(/* error, transition */) {
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    this.router.transitionTo('pipeline', pipelineId);
  }
}
