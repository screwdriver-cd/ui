import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model() {
    if (get(this, 'session.isAuthenticated')) {
      // No reason to go fetch collections for a guest user
      if (get(this, 'session.data.authenticated.isGuest')) {
        return;
      }

      this.store
        .findAll('collection')
        .then(collections => {
          if (get(collections, 'length')) {
            // Get the id of the last object in this array. The last
            // object will be the first collection created by the user.
            const routeId = get(collections, 'lastObject.id');

            this.replaceWith(`/dashboards/${routeId}`);
          }
        })
        .catch(() => {
          // do nothing
        });
    }
  }
});
