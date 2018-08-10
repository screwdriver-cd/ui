import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';

export default Route.extend({
  events: service(),
  routeAfterAuthentication: 'pipeline.events',
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  model(params) {
    return RSVP.all([
      this.get('events')
        .getEvents({
          page: 1,
          count: ENV.APP.NUM_EVENTS_LISTED,
          pipelineId: params.pipeline_id
        }),
      this.get('pipeline.jobs')
    ]).then(([events, jobs]) => ({
      pipeline: this.get('pipeline'),
      jobs: jobs.filter(j => !/^PR-/.test(j.get('name'))),
      pullRequests: jobs.filter(j => /^PR-/.test(j.get('name'))),
      // Prevent the model list updating multiple times during a render by pre-loading the data
      // before it is accessed in the template
      // Get first page of events
      events
    }));
  }
});
