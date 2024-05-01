import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class NewDashboardShowRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  /* eslint-disable camelcase */
  model({ collection_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
