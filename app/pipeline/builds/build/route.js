import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Route.extend({
  titleToken(model) {
    return `${model.job.get('name')} > #${model.build.get('sha').substr(0, 6)}`;
  },
  model(params) {
    return this.store.findRecord('build', params.build_id).then(build => {
      // reload again in a little bit if queued
      const reloadQueuedBuild = () => {
        if (build.get('status') === 'QUEUED') {
          Ember.run.later(this, () => {
            if (!build.get('isDeleted')) {
              build.reload().then(reloadQueuedBuild);
            }
          }, ENV.APP.RELOAD_TIMER);
        }
      };

      reloadQueuedBuild();

      return this.store.findRecord('job', build.get('jobId')).then(job => ({
        build, job, pipeline: this.modelFor('pipeline')
      }));
    });
  }
});
