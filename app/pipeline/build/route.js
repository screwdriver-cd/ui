import { all } from 'rsvp';
import Route from '@ember/routing/route';
import { set, get } from '@ember/object';
import { getActiveStep } from 'screwdriver-ui/utils/build';
import { inject as service } from '@ember/service';

export default Route.extend({
  router: service(),
  store: service(),
  routeAfterAuthentication: 'pipeline.build',

  model(params) {
    this.set('pipeline', this.modelFor('pipeline').pipeline);

    return this.store.findRecord('build', params.build_id).then(build =>
      all([
        this.store.findRecord('job', build.get('jobId')),
        this.store.findRecord('event', build.get('eventId'))
      ]).then(([job, event]) => ({
        build,
        job,
        event,
        pipeline: this.pipeline
      }))
    );
  },

  deactivate() {
    const model = this.modelFor(this.routeName);

    set(model.event, 'isPaused', false);
    set(model, 'userSelectedStepName', null);
  },

  redirect(model, transition) {
    const pipelineId = get(model, 'pipeline.id');

    // Build not found for this pipeline, redirecting to the pipeline page
    if (pipelineId !== get(model, 'job.pipelineId')) {
      this.router.transitionTo('pipeline', pipelineId);
    } else {
      set(model.event, 'isPaused', true);
      if (
        ['pipeline.build.step', 'pipeline.build.index'].includes(
          transition.targetName
        )
      ) {
        const preselectedStepName = transition?.to?.params?.step_id;

        let stepName = preselectedStepName;

        if (!preselectedStepName) {
          stepName = getActiveStep(get(model, 'build.steps'));
        }

        this.router.transitionTo(
          'pipeline.build.step',
          get(model, 'pipeline.id'),
          get(model, 'build.id'),
          stepName
        );
      }
    }
  }
});
