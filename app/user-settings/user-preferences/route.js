import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Route.extend({
  routeAfterAuthentication: 'user-settings',
  userSettings: service(),

  model() {
    return RSVP.hash({
      desiredJobNameLength: this.userSettings.getDesiredJobNameLength()
    }).catch(err => {
      this.transitionTo('/404');
    });
  }
});
