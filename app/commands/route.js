import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

@classic
export default class CommandsRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  routeAfterAuthentication = 'commands';

  model() {
    return this;
  }

  @action
  willTransition(transition) {
    let newParams = transition.to.params;

    this.controller.set('routeParams', newParams);
  }

  titleToken = 'Commands';
}
