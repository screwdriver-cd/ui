import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service store;

  @service shuttle;

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
  }
  /* eslint-enable camelcase */

  setupController(controller, { events, latestCommit }) {
    const { pipeline_id: pipelineId } = this.paramsFor('v2.pipeline');
    const { event_id: eventId } = this.paramsFor('v2.pipeline.events.show');
    const pipelineController = this.controllerFor('v2.pipeline');

    controller.setProperties({
      events,
      latestCommit,
      pipelineId,
      selectedEventId: eventId,
      pipeline: pipelineController.pipeline
    });
  }
}
