import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default class NewDashboardIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  model() {
    return this;
  }
}
