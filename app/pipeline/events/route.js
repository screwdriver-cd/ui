import { getWithDefault } from '@ember/object';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import ENV from 'screwdriver-ui/config/environment';
import getErrorMessage from 'screwdriver-ui/utils/error-messages';

export default Route.extend({
  shuttle: service(),
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.events',
  pipelineService: service('pipeline'),
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  setupController(controller, model = {}) {
    this._super(controller, model);
    const pipelinePreference = getWithDefault(model, 'pipelinePreference', {});

    controller.setProperties({
      activeTab: 'events',
      showPRJobs: getWithDefault(pipelinePreference, 'showPRJobs', true)
    });

    this.get('pipelineService').setBuildsLink('pipeline.events');
  },
  resetController(controller, isExiting, transition) {
    if (isExiting && transition.targetName !== 'error') {
      controller.set('errorMessage', '');
    }
  },
  model() {
    const pipelineId = this.get('pipeline.id');
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.setProperties({
      pipeline: this.pipeline,
      showDownstreamTriggers: getWithDefault(
        this.pipeline,
        'settings.showEventTriggers',
        false
      ),
      isFilteredEventsForNoBuilds: getWithDefault(
        this.pipeline,
        'settings.filterEventsForNoBuilds',
        false
      )
    });

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId,
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(pipelineId),
      pipelinePreference: this.shuttle.getUserPipelinePreference(pipelineId)
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
