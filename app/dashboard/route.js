import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'Dashboard',
  routeAfterAuthentication: 'home',

  beforeModel(/* transition */) {
    if (!get(this, 'session.isAuthenticated') || get(this, 'session.data.authenticated.isGuest')) {
      this.replaceWith('home');
    }
  },

  model() {
    return this.controllerFor('application').getWithDefault('collections', []);
  },

  actions: {
    error(/* error, transition */) {
      this.replaceWith('home');
    }
  }
});
