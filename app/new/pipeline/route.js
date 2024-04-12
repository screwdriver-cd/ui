import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class NewPipelineRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  model({ pipeline_id }) {
    return this;
  }
}
