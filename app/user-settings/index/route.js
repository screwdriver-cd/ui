import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  routeAfterAuthentication: 'user-settings',
  beforeModel() {
    this.router.transitionTo('user-settings.preferences');
  }
});
