import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  store: service(),
  shuttle: service(),

  /* eslint-disable camelcase */
  model() {
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');

    return RSVP.hash({
      events: this.store.query('event', {
        pipelineId,
        page: 1,
        // count: ENV.APP.NUM_EVENTS_LISTED
        count: 20
      }),
      latestCommit: this.shuttle.getLatestCommitEvent(pipelineId)
    });
  },
  /* eslint-enable camelcase */

  setupController(controller, { events, latestCommit }) {
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');
    const { event_id: eventId } = this.paramsFor('v2.pipeline.events.show');

    controller.pipelineId = pipelineId;
    controller.selectedEventId = eventId;

    controller.setProperties({ events, latestCommit });
  }
});
