import Ember from 'ember';

export default Ember.Route.extend({
  titleToken(model) {
    return `${model.job.get('name')} > #${model.build.get('sha').substr(0, 6)}`;
  },
  model(params) {
    return this.store.findRecord('build', params.build_id).then(build => Ember.RSVP.all([
      this.store.findRecord('job', build.get('jobId')),
      this.store.findRecord('event', build.get('eventId'))
    ]).then(([job, event]) => ({
      build, job, event, pipeline: this.modelFor('pipeline')
    })));
  }
});
