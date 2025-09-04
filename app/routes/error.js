// app/routes/application/error.js
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { is404 } from '../utils/not-found-error';

export default Route.extend(AuthenticatedRouteMixin, {
  setupController(controller, error) {
    this._super(...arguments);
    controller.set('is404', is404(error));
  }
});
