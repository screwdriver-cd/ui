import { later, throttle } from '@ember/runloop';
import { get, computed } from '@ember/object';
import { reads, mapBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import Controller from '@ember/controller';
import ENV from 'screwdriver-ui/config/environment';
import { getActiveStep } from 'screwdriver-ui/utils/build';

export default Controller.extend({
  router: service(),
  prEventsService: service('pr-events'),
  session: service('session'),
  loading: false,
  counter: 0,
  build: reads('model.build'),
  job: reads('model.job'),
  event: reads('model.event'),
  pipeline: reads('model.pipeline'),
  stepList: mapBy('build.steps', 'name'),
  isShowingModal: false,
  errorMessage: '',
  prEvents: computed('model.{event.pr.url,pipeline.id}', {
    get() {
      if (this.get('model.event.type') === 'pr') {
        const event = this.get('model.event.pr.url');
        const pipeline = this.get('model.pipeline.id');
        const jobId = this.get('job.id');

        if (event) {
          return this.prEventsService.getPRevents(pipeline, event, jobId);
        }
      }

      return [];
    }
  }),

  actions: {
    stopBuild() {
      const { build } = this;

      build.set('status', 'ABORTED');

      return build.save().catch(e => {
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    },

    startBuild() {
      this.set('isShowingModal', true);
      const buildId = get(this, 'build.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const causeMessage = `Manually started by ${user}`;
      const newEvent = this.store.createRecord('event', {
        buildId,
        causeMessage
      });

      return newEvent
        .save()
        .then(() =>
          newEvent.get('builds').then(builds => {
            this.set('isShowingModal', false);

            return this.transitionToRoute('pipeline.build', builds.get('lastObject.id'));
          })
        )
        .catch(e => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        });
    },

    reload() {
      throttle(this, 'reloadBuild', ENV.APP.BUILD_RELOAD_TIMER);
    },

    changeBuild(pipelineId, buildId) {
      return this.transitionToRoute('pipeline.build', pipelineId, buildId);
    },
    changeBuildStep(name) {
      this.changeBuildStep(name);
    },
    changeRouteTo(activeTab) {
      if (activeTab === 'artifacts') {
        this.transitionToRoute('pipeline.build.artifacts');
      } else {
        this.transitionToRoute('pipeline.build', this.get('pipeline.id'), this.get('build.id'));
      }
    }
  },

  /**
   * Schedules a build to reload after a certain amount of time
   * @method reloadBuild
   * @param  {Number}    [timeout=ENV.APP.BUILD_RELOAD_TIMER] ms to wait before reloading
   */
  reloadBuild(timeout = ENV.APP.BUILD_RELOAD_TIMER) {
    const { build } = this;
    const status = build.get('status');

    // reload again in a little bit if queued
    if (!this.loading) {
      if (['QUEUED', 'RUNNING'].includes(status)) {
        later(
          this,
          () => {
            if (!build.get('isDeleted') && !this.loading) {
              this.set('loading', true);
              build.reload().then(() => {
                this.set('loading', false);
                throttle(this, 'reloadBuild', timeout);
                this.changeBuildStep();
              });
            }
          },
          timeout
        );
      } else {
        // refetch builds which are part of current event
        this.event.hasMany('builds').reload();
      }
    }
  },

  changeBuildStep(name) {
    const currentRouteName = this.getWithDefault('router.currentRoute.name', '');

    if (!['pipeline.build.step', 'pipeline.build.index'].includes(currentRouteName)) {
      return;
    }

    const build = this.get('build');
    const pipelineId = this.get('pipeline.id');
    let activeStep;

    if (name) {
      activeStep = name;
      this.set('userSelectedStepName', name);
    } else if (!this.userSelectedStepName) {
      activeStep = getActiveStep(get(build, 'steps'));
    }

    if (activeStep && this.get('preselectedStepName') !== activeStep) {
      this.transitionToRoute('pipeline.build.step', pipelineId, build.get('id'), activeStep);
    }
  }
});
