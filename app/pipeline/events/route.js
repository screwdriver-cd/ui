import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import { get, getWithDefault, action } from '@ember/object';
import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import getErrorMessage from 'screwdriver-ui/utils/error-messages';
import RSVP from 'rsvp';

@classic
export default class EventsRoute extends Route {
  @service
  shuttle;

  @service('pipeline-triggers')
  triggerService;

  routeAfterAuthentication = 'pipeline.events';

  @service('pipeline')
  pipelineService;

  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  }

  setupController(controller, model = {}) {
    super.setupController(controller, model);
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
  }

  model() {
    const pipelineId = this.get('pipeline.id');
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.setProperties({
      pipeline: this.pipeline,
      showDownstreamTriggers: getWithDefault(
        this.pipeline,
        'settings.showEventTriggers',
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
  }

  @action
  refreshModel() {
    this.refresh();
  }
}
