import { later, once } from '@ember/runloop';
import { mapBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import ENV from 'screwdriver-ui/config/environment';

export default Controller.extend({
  session: service('session'),
  loading: false,
  counter: 0,
  stepList: mapBy('model.build.steps', 'name'),

  actions: {
    stopBuild() {
      const build = this.get('model.build');

      build.set('status', 'ABORTED');
      build.save();
    },

    startBuild() {
      const pipelineId = this.get('model.pipeline.id');
      const jobName = this.get('model.job.name');
      const newEvent = this.store.createRecord('event', {
        pipelineId,
        startFrom: jobName
      });

      return newEvent.save()
        .then(() =>
          newEvent.get('builds')
            .then(builds =>
              this.transitionToRoute('pipeline.builds.build',
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
    const build = this.get('model.build');
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
        this.get('model.event').hasMany('builds').reload();
      }
    }
  }
});
