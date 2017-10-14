import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

export default Route.extend(UnauthenticatedRouteMixin, {
  titleToken: 'Login',
  routeIfAlreadyAuthenticated: 'home',
  scmService: service('scm'),
  model() {
    return this.get('scmService').getScms();
  }
});
