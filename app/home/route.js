import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

export default Ember.Route.extend(UnauthenticatedRouteMixin, {
  beforeModel() {
    if (this.get('session').get('isAuthenticated')) {
      this.get('store').findAll('collection')
        .then((collections) => {
          const userCollections = collections.toArray();
          const length = userCollections.length;

          if (length) {
            // Get the id of the last object in this array. The last
            // object will be the first collection created by the user.
            const routeId = userCollections[length - 1].id;

            this.replaceWith(`/dashboards/${routeId}`);
          }
        })
        .catch(() => {
          // do nothing
        });
    }
  }
});
