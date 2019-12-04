import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';

export default Route.extend({
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.events',
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'events');
  },
  model() {
    this.controllerFor('pipeline.events').set('pipeline', this.pipeline);

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId: this.get('pipeline.id'),
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(this.get('pipeline.id'))
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
