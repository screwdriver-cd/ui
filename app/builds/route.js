import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  model(params) {
    return this.store
      .findRecord('build', params.build_id)
      .then(build =>
        this.store
          .findRecord('job', build.get('jobId'))
          .then(job =>
            this.store
              .findRecord('pipeline', job.get('pipelineId'))
              .then(pipeline => ({ build, job, pipeline }))
          )
      );
  },
  redirect(model) {
    return this.router.transitionTo(
      'pipeline.build',
      model.pipeline.id,
      model.build.id
    );
  }
});
