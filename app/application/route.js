import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  scmService: service('scm'),
  routeAfterAuthentication: 'home',
  model() {
    return this.get('scmService').createScms();
  },
  sessionInvalidated: () => window.location.replace(window.location.href),
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
