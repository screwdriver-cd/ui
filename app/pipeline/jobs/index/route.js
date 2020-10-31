import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.jobs.index',
  pipelineService: service('pipeline'),
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'events');
    this.get('pipelineService').setBuildsLink('pipeline.jobs.index');
  },
  model() {
    this.controllerFor('pipeline.jobs.index').set('pipeline', this.pipeline);

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId: this.get('pipeline.id'),
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(this.get('pipeline.id'))
    }).catch(() => {
      this.transitionTo('/404');
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
