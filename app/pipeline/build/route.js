import { all } from 'rsvp';
import Route from '@ember/routing/route';
import { set } from '@ember/object';

export default Route.extend({
  routeAfterAuthentication: 'pipeline.build',

  model(params) {
    this.set('pipeline', this.modelFor('pipeline').pipeline);

    return this.store.findRecord('build', params.build_id).then(build => all([
      this.store.findRecord('job', build.get('jobId')),
      this.store.findRecord('event', build.get('eventId'))
    ]).then(([job, event]) => ({
      build,
      job,
      event,
      pipeline: this.get('pipeline')
    })));
  },

  afterModel(model) {
    const pipelineId = model.pipeline.get('id');

    // Build not found for this pipeline, redirecting to the pipeline page
    if (pipelineId !== model.job.get('pipelineId')) {
      this.transitionTo('pipeline', pipelineId);
    } else {
      set(model.event, 'isPaused', true);
    }
  },

  titleToken(model) {
    return `${model.job.get('name')} > #${model.build.get('truncatedSha')}`;
  },

  deactivate() {
    const model = this.modelFor(this.routeName);

    set(model.event, 'isPaused', false);
  }
});
