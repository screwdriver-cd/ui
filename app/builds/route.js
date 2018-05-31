import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    return this.store.findRecord('build', params.build_id).then(build =>
      this.store.findRecord('job', build.get('jobId'))
        .then(job => this.store.findRecord('pipeline', job.get('pipelineId'))
          .then(pipeline => ({ build, job, pipeline })))
    );
  },
  redirect(model) {
    return this.transitionTo('pipeline.build', model.pipeline.id, model.build.id);
  }
});
