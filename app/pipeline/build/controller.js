import { later, once } from '@ember/runloop';
import { get, computed } from '@ember/object';
import { reads, mapBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import Controller from '@ember/controller';
import ENV from 'screwdriver-ui/config/environment';

import $ from 'jquery';

export default Controller.extend({
  prEventsService: service('pr-events'),
  queryParams: ['type'],
  type: null,
  session: service('session'),
  loading: false,
  counter: 0,
  build: reads('model.build'),
  jobs: reads('model.jobs'),
  job: reads('model.job'),
  event: reads('model.event'),
  pipeline: reads('model.pipeline'),
  stepList: mapBy('build.steps', 'name'),
  isShowingModal: false,
  prEvents: computed('model.event.pr.url', 'model.pipeline.id', {
    get() {
      if(this.get('model.event.type') == 'pr') {
        const event = this.get('model.event.pr.url');
        const pipeline = this.get('model.pipeline.id');
        console.log('HELLLLLLLLO')
        console.log(event, pipeline)
        return this.get('prEventsService').getPRevents(pipeline, event).then( prCommits => {
            console.log(prCommits);
            return prCommits;

        })
      }
      return [];
    }
  }),

  actions: {

    test() {
      //this.transitionToRoute('pipeline.build', 2,);
      // const pipelineId = get(this, 'pipeline.id');
      // const eventPrUrl = get(this,'event.pr.url');
      // console.log(pipelineId);
      // console.log(eventPrUrl);
      // this.get('prEventsService').getPRevents(pipelineId, eventPrUrl).then( prCommits => {
      //   this.set('prCommits', prCommits);
      // })

      const buildStatus = this.get('build.status');
      const buildId = this.get('build.id');
      const buildsteps = this.get('build.steps');
      const buildstart = this.get('build.startTime');
      console.log(buildStatus, buildId, buildsteps, buildstart)
    },

    stopBuild() {
      const build = this.get('build');

      build.set('status', 'ABORTED');
      build.save();
    },

    startBuild() {
      this.set('isShowingModal', true);
      const buildId = get(this, 'build.id');
      const jobName = get(this, 'job.name');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const causeMessage =
        `${user} clicked restart for job "${jobName}" for sha ${get(this, 'event.sha')}`;
      const newEvent = this.store.createRecord('event', {
        buildId,
        causeMessage
      });

      return newEvent.save().then(() =>
        newEvent.get('builds')
          .then((builds) => {
            this.set('isShowingModal', false);

            return this.transitionToRoute('pipeline.build',
              builds.get('lastObject.id'));
          }
          ));
    },

    reload() {
      // If there is already a reload scheduled in the runloop,
      // this replaces it with one with no timeout
      once(this, 'reloadBuild', 0);
    },

    changeBuild(pipelineId, buildId) {
      console.log(pipelineId, buildId);
      //    var buildPath = 'builds/' +buildId;
      //debugger
      return this.transitionToRoute('pipeline.build', pipelineId, buildId);

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
