import { inject as service } from '@ember/service';
import { get, observer } from '@ember/object';
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
    return this.scmService.createScms();
  },
  setupController(controller) {
    this._super(...arguments);
    if (
      get(this, 'session.isAuthenticated') &&
      !get(this, 'session.data.authenticated.isGuest')
    ) {
      controller.set('collections', this.store.findAll('collection'));
    }
  },
  sessionInvalidated() {
    this.reloadPage();
  },
  // eslint-disable-next-line ember/no-observers
  sessionChanged: observer(
    'session.data.sessionChanged',
    function sessionChanged() {
      if (this.session.get('data.sessionChanged')) {
        this.session.set('data.sessionChanged', false);
        this.store.unloadAll();
        this.reloadPage();
      }
    }
  )
});
