import { get } from '@ember/object';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import ENV from 'screwdriver-ui/config/environment';
import getErrorMessage from 'screwdriver-ui/utils/error-messages';
import { NotFoundError } from '../../utils/not-found-error';

export default Route.extend({
  store: service(),
  router: service(),
  shuttle: service(),
  triggerService: service('pipeline-triggers'),
  routeAfterAuthentication: 'pipeline.events',
  pipelineService: service('pipeline'),
  userSettings: service(),
  optInRouteMapping: service(),
  beforeModel(transition) {
    const { pipeline } = this.modelFor('pipeline');

    if (
      this.optInRouteMapping.switchFromV2 ||
      localStorage.getItem('oldUi') === 'true'
    ) {
      this.set('pipeline', pipeline);
      this.optInRouteMapping.switchFromV2 = false;

      return;
    }

    if (transition.from && transition.from.name === 'pipeline.pulls') {
      this.set('pipeline', pipeline);
      this.optInRouteMapping.switchFromV2 = false;

      return;
    }

    if (transition.intent.URL) {
      this.replaceWith(`/v2${transition.intent.URL}`);
    } else {
      this.replaceWith('v2.pipeline.events', pipeline.id);
    }
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
  async model() {
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
      filterSchedulerEvents:
        get(this.pipeline, 'settings.filterSchedulerEvents') === undefined
          ? false
          : get(this.pipeline, 'settings.filterSchedulerEvents'),
      aliasName:
        get(this.pipeline, 'settings.aliasName') === undefined
          ? ''
          : get(this.pipeline, 'settings.aliasName')
    });

    return RSVP.hash({
      jobs: this.get('pipeline.jobs'),
      stages: this.shuttle.fetchStages(pipelineId),
      events: this.store.query('event', {
        pipelineId,
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      }),
      triggers: this.triggerService.getDownstreamTriggers(pipelineId),
      pipelinePreference:
        this.pipelineService.getUserPipelinePreference(pipelineId),
      desiredJobNameLength: this.userSettings.getDisplayJobNameLength()
    }).catch(err => {
      const errorMessage = getErrorMessage(err);

      if (errorMessage !== '') {
        pipelineEventsController.set('errorMessage', errorMessage);
      } else {
        throw new NotFoundError('Pipeline not found');
      }
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      this.refresh();
    }
  }
});
