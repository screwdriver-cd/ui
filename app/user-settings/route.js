import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'User Settings',
  routeAfterAuthentication: 'user-settings',
  model() {
    return this.get('store').findAll('token');
  }
});
