import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class NewPipelineEventsShowRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  model({ event_id }) {
    return this;
  }
}
