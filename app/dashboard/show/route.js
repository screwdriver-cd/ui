import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    return this.store.findRecord('collection', params.collection_id);
  },
  actions: {
    error() {
      return this.transitionTo('/404');
    }
  }
});
