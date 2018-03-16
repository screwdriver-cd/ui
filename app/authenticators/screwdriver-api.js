import { isEmpty } from '@ember/utils';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Base from 'ember-simple-auth/authenticators/base';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import ENV from 'screwdriver-ui/config/environment';
const loginUrlBase = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/login`;
const tokenUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/token`;
const logoutUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/logout`;

/**
 * Fetches a jwt from api and returns result in RSVP Promise
 * @method fetchToken
 * @return {Promise}
 */
function fetchToken() {
  return new EmberPromise((resolve, reject) => {
    // Call the token api to get the session info
    $.ajax({
      url: tokenUrl,
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    })
      .done((jwt) => {
        // Add some data from the JWT to the session data
        const { username, scope, scmContext } = decoder(jwt.token);

        resolve(Object.assign({}, {
          username,
          scope,
          scmContext,
          isGuest: scope.includes('guest'),
          token: jwt.token
        }));
      })
      .fail(() => reject('Could not get a token'));
  });
}

export default Base.extend({
  scmService: service('scm'),

  /**
   * Restore the state of a session with data already in the session store
   * @method restore
   * @param  {Object}  data    Data in the session store
   * @return {Promise}
   */
  restore(data) {
    return new EmberPromise((resolve, reject) => {
      const token = get(data, 'token');

      if (!isEmpty(token)) {
        const jwt = decoder(token);

        // Token expired, reject
        if (jwt.exp * 1000 < Date.now()) {
          return reject();
        }

        const { username, scope, scmContext } = jwt;

        resolve(Object.assign({}, {
          username,
          scope,
          scmContext,
          isGuest: scope.includes('guest'),
          token: data.token
        }));

        return resolve(data);
      }

      return reject();
    });
  },

  /**
   * Authenticates with resource
   * @method authenticate
   * @param  {String}  [scmContext]    scmContext of the user
   * @return {Promise}
   */
  authenticate(scmContext) {
    const scm = this.get('scmService');

    return new EmberPromise((resolve, reject) => {
      let url = [loginUrlBase];

      if (scmContext) {
        url.push(scmContext);
      }
      url.push('web');

      // Open a window for github auth flow
      const win = window.open(url.join('/'), 'SDAuth',
        'width=1024,height=768,resizable,alwaysRaised');

      // check to see if the window has closed
      const interval = setInterval(() => {
        if (win === null || win.closed) {
          clearInterval(interval);

          fetchToken().then(resolve, reject);

          // change status as logged in.
          scm.setSignedIn(scmContext);
        } else {
          win.focus();
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
    return new EmberPromise((resolve) => {
      $.ajax({
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
