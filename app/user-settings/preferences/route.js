import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'user-settings',
  userSettings: service(),
  titleToken: 'Preferences',

  model() {
    return RSVP.hash({
      desiredJobNameLength: this.userSettings.getDisplayJobNameLength()
    }).catch(e => {
      console.log('error', e);

      this.transitionTo('/404');
    });
  }
});
