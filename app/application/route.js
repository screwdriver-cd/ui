import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  routeAfterAuthentication: 'home',
  sessionInvalidated: function sessionInvalidated() {
    window.location.replace(window.location.href);
  },
  sessionAuthenticated: function sessionAuthenticated() {
    const previousUrl = this.controllerFor('application').get('fromUrl');

    if (previousUrl) {
      this.transitionTo(previousUrl);
    } else {
      this._super();
    }
  },
  title(tokens) {
    let arr = Array.isArray(tokens) ? tokens : [];

    arr.push('screwdriver.cd');

    return arr.join(' > ');
  }
});
