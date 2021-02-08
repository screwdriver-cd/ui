import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import { getErrorMessage } from 'screwdriver-ui/utils/error-messages';
import RSVP from 'rsvp';

export default Route.extend({
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.events',
  pipelineService: service('pipeline'),
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'events');
    this.get('pipelineService').setBuildsLink('pipeline.events');
  },
  model() {
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.set('pipeline', this.pipeline);

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId: this.get('pipeline.id'),
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(this.get('pipeline.id'))
    }).catch(err => {
      let errorMessage = getErrorMessage(err);

      if (errorMessage !== '') {
        pipelineEventsController.set('errorMessage', errorMessage);
      } else {
        this.transitionTo('/404');
      }
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
