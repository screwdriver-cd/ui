import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),

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
    }
  }
});
