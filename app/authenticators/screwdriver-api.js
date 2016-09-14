import Ember from 'ember';
import Base from 'ember-simple-auth/authenticators/base';

import ENV from 'screwdriver-ui/config/environment';
const loginUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/login/web`;
const tokenUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/token`;
const logoutUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/logout`;

export default Base.extend({
  /**
   * Restore the state of a session with data already in the session store
   * @method restore
   * @param  {Object}  data    Data in the session store
   * @return {Promise}
   */
  restore(data) {
    const properties = Ember.Object.create(data);

    return new Ember.RSVP.Promise((resolve, reject) => {
      if (!Ember.isEmpty(properties.get('token'))) {
        return resolve(data);
      }

      return reject();
    });
  },

  /**
   * Authenticates with resource
   * @method authenticate
   * @return {Promise}
   */
  authenticate() {
    // TODO: just try to get token first
    // Open a window for github auth flow
    const win = window.open(loginUrl, 'SDAuth', 'modal=yes');

    return new Ember.RSVP.Promise((resolve, reject) => {
      // check to see if the window has closed
      const interval = setInterval(() => {
        if (win.closed) {
          clearInterval(interval);

          // Call the token api to get the session info
          Ember.$.ajax({
            url: tokenUrl,
            crossDomain: true,
            xhrFields: {
              withCredentials: true
            }
          })
          .done(jwt => resolve(jwt))
          .fail(() => reject('Could not get a token'));
        }
      }, 100);
    });
  },

  /**
   * Log the user out from the resource
   * @method invalidate
   * @return {Promise}
   */
  invalidate() {
    return new Ember.RSVP.Promise(resolve => {
      Ember.$.ajax({
        url: logoutUrl,
        method: 'POST',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        }
      })
      .always(() => resolve());
    });
  }
});
