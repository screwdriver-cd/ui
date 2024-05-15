import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service
  store;

  /* eslint-disable camelcase */
  model() {
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');

    return RSVP.hash({
      events: this.store.query('event', {
        pipelineId,
        page: 1,
        // count: ENV.APP.NUM_EVENTS_LISTED
        count: 20
      })
    });
  }
  /* eslint-enable camelcase */

  setupController(controller, { events }) {
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');
    const { event_id: eventId } = this.paramsFor('v2.pipeline.events.show');

    // static
    controller.pipelineId = pipelineId;

    // dynamic
    // controller.selectedEventId = eventId;
    // controller.events = events;

    controller.set('selectedEventId', eventId);
    controller.set('events', events);
  }
}
