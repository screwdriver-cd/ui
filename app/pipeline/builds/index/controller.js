import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),
  actions: {
    startMainBuild() {
      const main = this.get('model.jobs').objectAt(0);
      const lastBuild = main.get('builds').objectAt(0);
      const status = lastBuild.get('status');

      // build is already running, just go to the build
      if (status === 'QUEUED' || status === 'RUNNING') {
        return this.transitionToRoute('pipeline.builds.build', lastBuild.get('id'));
      }

      const newBuild = this.store.createRecord('build', { jobId: main.get('id') });

      return newBuild.save().then(b =>
        this.transitionToRoute('pipeline.builds.build', b.get('id'))
      );
    }
  }
});
