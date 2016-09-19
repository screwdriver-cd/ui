import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline'));
  },
  model() {
    // Get the jobs in this pipeline, and ALL builds (since there's no jobs/:id/builds, yet)
    return Ember.RSVP.all([this.get('pipeline.jobs'), this.store.findAll('build')])
      .then(([jobs, builds]) => {
        // get a list of job ids for active jobs
        const jobIds = jobs.filter(j => j.state !== 'DISABLED').map(j => j.get('id'));

        // return a list of builds that are related to those job ids
        return {
          builds: builds.filter(b => jobIds.contains(b.get('jobId'))),
          jobs
        };
      });
  }
});
