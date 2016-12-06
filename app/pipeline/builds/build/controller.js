import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),
  loading: false,
  counter: 0,
  stepList: Ember.computed.mapBy('model.build.steps', 'name'),

  /**
   * Schedules a build to reload after a certain amount of time
   * @method reloadBuild
   * @param  {Number}    [timeout=ENV.APP.BUILD_RELOAD_TIMER] ms to wait before reloading (1000)
   */
  reloadBuild(timeout = ENV.APP.BUILD_RELOAD_TIMER) {
    const build = this.get('model.build');
    const status = build.get('status');

    // reload again in a little bit if queued
    if ((status === 'QUEUED' || status === 'RUNNING') && !this.get('loading')) {
      Ember.run.later(this, () => {
        if (!build.get('isDeleted') && !this.get('loading')) {
          this.set('loading', true);

          build.reload().then(() => {
            this.set('loading', false);
            Ember.run.once(this, 'reloadBuild');
          });
        }
      }, timeout);
    }
  },

  actions: {
    stopBuild() {
      const build = this.get('model.build');

      build.set('status', 'ABORTED');
      build.save();
    },

    startBuild() {
      const jobId = this.get('model.build.jobId');
      const build = this.store.createRecord('build', { jobId });

      return build.save()
        .then(() => this.transitionToRoute('pipeline.builds.build', build.get('id')));
    },

    reload() {
      // If there is already a reload scheduled in the runloop,
      // this replaces it with one with no timeout
      Ember.run.once(this, 'reloadBuild', 0);
    }
  }
});
