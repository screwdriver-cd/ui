import { later, once } from '@ember/runloop';
import { get } from '@ember/object';
import { reads, mapBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import Controller from '@ember/controller';
import ENV from 'screwdriver-ui/config/environment';

export default Controller.extend({
  session: service('session'),
  loading: false,
  counter: 0,
  build: reads('model.build'),
  jobs: reads('model.jobs'),
  job: reads('model.job'),
  event: reads('model.event'),
  pipeline: reads('model.pipeline'),
  stepList: mapBy('build.steps', 'name'),

  actions: {
    stopBuild() {
      const build = this.get('build');

      build.set('status', 'ABORTED');
      build.save();
    },

    startBuild() {
      const buildId = get(this, 'build.id');
      const parentBuildId = get(this, 'build.parentBuildId');
      const event = get(this, 'event');
      const parentEventId = get(event, 'id');
      const startFrom = get(this, 'job.name');
      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const causeMessage =
        `${user} clicked restart for job "${startFrom}" for sha ${get(event, 'sha')}`;
      const newEvent = this.store.createRecord('event', {
        buildId,
        pipelineId,
        startFrom,
        parentBuildId,
        parentEventId,
        causeMessage
      });

      return newEvent.save().then(() =>
        newEvent.get('builds')
          .then(builds =>
            this.transitionToRoute('pipeline.build',
              builds.get('lastObject.id'))
          ));
    },

    reload() {
      // If there is already a reload scheduled in the runloop,
      // this replaces it with one with no timeout
      once(this, 'reloadBuild', 0);
    }
  },

  /**
   * Schedules a build to reload after a certain amount of time
   * @method reloadBuild
   * @param  {Number}    [timeout=ENV.APP.BUILD_RELOAD_TIMER] ms to wait before reloading
   */
  reloadBuild(timeout = ENV.APP.BUILD_RELOAD_TIMER) {
    const build = this.get('build');
    const status = build.get('status');

    // reload again in a little bit if queued
    if (!this.get('loading')) {
      if ((status === 'QUEUED' || status === 'RUNNING')) {
        later(this, () => {
          if (!build.get('isDeleted') && !this.get('loading')) {
            this.set('loading', true);

            build.reload().then(() => {
              this.set('loading', false);
              once(this, 'reloadBuild');
            });
          }
        }, timeout);
      } else {
        // refetch builds which are part of current event
        this.get('event').hasMany('builds').reload();
      }
    }
  }
});
