import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'pipeline.options',
  model() {
    const pipeline = this.modelFor('pipeline');

    // Prevent double render when jobs list updates asynchronously
    return pipeline.get('jobs').then(jobs => ({ pipeline, jobs }));
  }
});
