import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class NewPipelineEventsShowRoute extends Route.extend(
  AuthenticatedRouteMixin
) {  
  /* eslint-disable camelcase */
  model({ event_id }) {
    return this;
  }
  /* eslint-enable camelcase */
}
