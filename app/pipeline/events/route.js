import { get } from '@ember/object';
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
  userSettings: service(),
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  setupController(controller, model = {}) {
    this._super(controller, model);
    const pipelinePreference =
      model.pipelinePreference === undefined ? {} : model.pipelinePreference;

    controller.setProperties({
      activeTab: 'events',
      showPRJobs:
        pipelinePreference.showPRJobs === undefined
          ? true
          : pipelinePreference.showPRJobs
    });

    this.pipelineService.setBuildsLink('pipeline.events');
  },
  resetController(controller, isExiting, transition) {
    if (isExiting && transition && transition.targetName !== 'error') {
      controller.set('errorMessage', '');
    }
  },
  model() {
    const pipelineId = this.get('pipeline.id');
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.setProperties({
      pipeline: this.pipeline,
      showDownstreamTriggers:
        get(this.pipeline, 'settings.showEventTriggers') === undefined
          ? false
          : get(this.pipeline, 'settings.showEventTriggers'),
      isFilteredEventsForNoBuilds:
        get(this.pipeline, 'settings.filterEventsForNoBuilds') === undefined
          ? false
          : get(this.pipeline, 'settings.filterEventsForNoBuilds'),
      aliasName:
        get(this.pipeline, 'settings.aliasName') === undefined
          ? ''
          : get(this.pipeline, 'settings.aliasName')
    });

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      events: this.store.query('event', {
        pipelineId,
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(pipelineId),
      pipelinePreference: this.shuttle.getUserPipelinePreference(pipelineId),
      desiredJobNameLength: this.userSettings.getDisplayJobNameLength()
    }).catch(err => {
      const errorMessage = getErrorMessage(err);

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
