import { all } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.build',

  model(params) {
    this.set('pipeline', this.modelFor('pipeline').pipeline);

    return this.store.findRecord('build', params.build_id).then(build => all([
      this.store.findRecord('job', build.get('jobId')),
      this.store.findRecord('event', build.get('eventId')),
      this.get('pipeline.jobs')
    ]).then(([job, event, jobs]) => ({
      build,
      job,
      event,
      pipeline: this.get('pipeline'),
      jobs: jobs.filter(j => !/^PR-/.test(j.get('name'))),
      events: this.get('pipeline.events')
    })));
  },

  afterModel(model) {
    const pipelineId = model.pipeline.get('id');

    // Build not found for this pipeline, redirecting to the pipeline page
    if (pipelineId !== model.job.get('pipelineId')) {
      this.transitionTo('pipeline', pipelineId);
    }
  },

  titleToken(model) {
    return `${model.job.get('name')} > #${model.build.get('sha').substr(0, 6)}`;
  },

  actions: {
    willTransition(transition) {
      let newParams = transition.params[transition.targetName];

      this.controller.set('routeParams', newParams);
    }
  }
});
