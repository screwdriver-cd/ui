import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import getErrorMessage from 'screwdriver-ui/utils/error-messages';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.jobs.index',
  pipelineService: service('pipeline'),
  beforeModel() {
    const { pipeline } = this.modelFor('pipeline');

    if (localStorage.getItem('newUI') === 'true') {
      this.transitionTo('v2.pipeline.jobs', pipeline.id);
    } else {
      this.set('pipeline', pipeline);
    }
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'events');
    this.pipelineService.setBuildsLink('pipeline.jobs.index');
  },
  model() {
    const pipelineJobsIndexController = this.controllerFor(
      'pipeline.jobs.index'
    );

    pipelineJobsIndexController.set('pipeline', this.pipeline);

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId: this.get('pipeline.id'),
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(
        this.get('pipeline.id')
      )
    }).catch(err => {
      const errorMessage = getErrorMessage(err);

      if (errorMessage !== '') {
        pipelineJobsIndexController.set('errorMessage', errorMessage);
      } else {
        this.router.transitionTo('/404');
      }
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
