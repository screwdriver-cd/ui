import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  store: service(),
  session: service(),
  titleToken: 'User Settings',
  routeAfterAuthentication: 'user-settings',
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('home');
    }
    this.store.unloadAll('token');

    return this.store.findAll('token');
  }
});
