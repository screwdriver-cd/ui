import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { NotFoundError } from '../../utils/not-found-error';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  routeAfterAuthentication: 'user-settings',
  userSettings: service(),

  model() {
    return RSVP.hash({
      desiredJobNameLength: this.userSettings.getDisplayJobNameLength()
    }).catch(() => {
      throw new NotFoundError('User not found');
    });
  }
});
