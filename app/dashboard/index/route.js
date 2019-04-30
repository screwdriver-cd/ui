import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'Dashboard',
  routeAfterAuthentication: 'home',

  activate() {
    if (!get(this, 'session.isAuthenticated') || get(this, 'session.data.authenticated.isGuest')) {
      this.replaceWith('home');
    }

    return this.store
      .findAll('collection')
      .then(collections => {
        if (get(collections, 'length')) {
          // Get the id of the last object in this array. The last
          // object will be the first collection created by the user.
          const routeId = get(collections, 'lastObject.id');

          this.replaceWith(`/dashboards/${routeId}`);
        } else {
          this.replaceWith('home');
        }
      })
      .catch(() => {
        this.replaceWith('home');
      });
  }
});
