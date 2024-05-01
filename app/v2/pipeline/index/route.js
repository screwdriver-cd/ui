import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class NewPipelineIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  /* eslint-disable camelcase */
  model({ pipeline_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
