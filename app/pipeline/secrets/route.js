import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
export default Ember.Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'pipeline.secrets',
  titleToken: 'Secrets',
  model() {
    const pipeline = this.modelFor('pipeline');

    return pipeline.get('secrets')
      .then(secrets => ({
        secrets,
        pipeline
      }));
  }
});
