import { get, action } from '@ember/object';
import Route from '@ember/routing/route';
import { debounce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default class PipelineEventsShowRoute extends Route {
  @service router;
  @service store;

  eventId = undefined;

  hasScrolled = false;

  selfRedirect = false;

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

  async beforeModel() {
    const { event_id: eventId } = this.paramsFor(this.routeName);
    const event = await this.store.findRecord('event', eventId);
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    if (event.get('pipelineId') !== pipelineId) {
      this.router.transitionTo('pipeline', pipelineId);
    }
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    const { event_id: eventId } = this.paramsFor(this.routeName);
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.set('selected', eventId);

    const event = await this.store.findRecord('event', eventId);
    pipelineEventsController.paginateEvents.pushObject(event);

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
      this.selfRedirect = true;
    } else {
      this.selfRedirect = false;
    }
  }

  @action
  didTransition() {
    if (!this.hasScrolled && !this.selfRedirect) {
      later(() => {
        debounce(
          this,
          this.scrollToHighlightedEvent,
          ENV.APP.DEBOUNCED_SCROLL_TIME
        );
      }, ENV.APP.WAITING_TO_SCROLL_TIME);
    }

    return true;
  }

  @action
  error(/* error, transition */) {
    const { pipeline_id: pipelineId } = this.paramsFor('pipeline');

    this.router.transitionTo('pipeline', pipelineId);
  }
}
