import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  scmService: service('scm'),
  session: service('session'),
  store: service('store'),
  reloadPage: window.location.reload.bind(window.location),
  beforeModel(transition) {
    if (!this.get('session.isAuthenticated')) {
      this.set('session.attemptedTransition', transition);
    }
  },
  model() {
    return this.get('scmService').createScms();
  },
  sessionInvalidated() {
    this.reloadPage();
  },
  sessionChanged: observer('session.data.sessionChanged', function sessionChanged() {
    if (this.get('session').get('data.sessionChanged')) {
      this.get('session').set('data.sessionChanged', false);
      this.store.unloadAll();
      this.reloadPage();
    }
  }),
  title(tokens) {
    let arr = Array.isArray(tokens) ? tokens : [];

    arr.push('screwdriver.cd');

    return arr.join(' > ');
  }
});
