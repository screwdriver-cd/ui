import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.events',
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
    this.set('events', this.modelFor('pipeline').events);
  },
  model() {
    return this.get('pipeline.jobs')
      .then(jobs => ({
        pipeline: this.get('pipeline'),
        jobs: jobs.filter(j => !/^PR-/.test(j.get('name'))),
        pullRequests: jobs.filter(j => /^PR-/.test(j.get('name'))),
        // Get the first page of events
        events: this.get('events')
      }));
  }
});
