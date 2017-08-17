import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Route.extend(UnauthenticatedRouteMixin, {
  titleToken: 'Login',
  routeIfAlreadyAuthenticated: 'home',
  model() {
    return Ember.$.getJSON(
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/contexts`
    ).catch(() => []);
  }
});
