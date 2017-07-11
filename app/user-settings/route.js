import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'User Settings',
  routeAfterAuthentication: 'user-settings',
  model() {
    return this.get('store').findAll('token');
  }
});
