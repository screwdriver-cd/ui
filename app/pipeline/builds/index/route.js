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
        pullRequests: jobs.filter(j => /^PR-/.test(j.get('name'))),
        // Prevent the model list updating multiple times during a render by pre-loading the data
        // before it is accessed in the template
        events: this.get('pipeline.events')
      }));
  }
});
