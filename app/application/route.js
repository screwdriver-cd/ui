import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import App from '../app';
export default Ember.Route.extend(ApplicationRouteMixin, {
  sessionAuthenticated() {
    // set the previous path to redirect
    this.routeAfterAuthentication = App.previousPath;

    return this._super(...arguments);
  },
  title(tokens) {
    let arr = Array.isArray(tokens) ? tokens : [];

    arr.push('screwdriver.cd');

    return arr.join(' > ');
  }
});
