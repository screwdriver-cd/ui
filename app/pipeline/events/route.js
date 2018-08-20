import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.events',
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  model() {
    return RSVP.all([
      this.get('pipeline.jobs'),
      this.store.query('event', {
        pipelineId: this.get('pipeline.id'),
        page: 1,
        count: ENV.APP.NUM_EVENTS_LISTED
      })
    ])
      .then(([jobs, events]) => ({
        pipeline: this.get('pipeline'),
        jobs: jobs.filter(j => !/^PR-/.test(j.get('name'))),
        pullRequests: jobs.filter(j => /^PR-/.test(j.get('name'))),
        // Get the first page of events
        events: events.toArray()
      }));
  }
});
