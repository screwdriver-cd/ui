import Ember from 'ember';

export default Ember.Route.extend({
  routeAfterAuthentication: 'pipeline',
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline'));
  },
  model() {
    return this.get('pipeline.jobs')
      // Split jobs from workflow
      .then(jobs => ({
        pipeline: this.get('pipeline'),
        jobs: jobs.filter(j => !/^PR-/.test(j.get('name'))),
        pullRequests: jobs.filter(j => /^PR-/.test(j.get('name')))
      }));
  }
});
