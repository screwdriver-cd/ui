import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'home',

  model() {
    return this.modelFor('dashboard');
  },

  afterModel(collections) {
    if (collections.get('length')) {
      // Get the id of the last object in this array. The last
      // object will be the first collection created by the user.
      const collection = collections.lastObject;
      const routeId = collection.get('id');

      this.replaceWith(`/dashboards/${routeId}`);
    } else {
      this.replaceWith('search');
    }
  },

  actions: {
    error(/* error, transition */) {
      this.replaceWith('home');
    }
  }
});
