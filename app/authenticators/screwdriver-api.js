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
 * Constructs session.data.authenticated object
 * @method getData
 * @param  {String} token        JWT Token
 * @param  {Object} decodedToken Decoded JWT Token
 * @return {Object}
 */
function getData(token, decodedToken) {
  let { username, scope, scmContext } = decodedToken;
  const isGuest = scope.includes('guest');

  if (isGuest) {
    scmContext = scmContext || 'guest';
  }

  return Object.assign({}, {
    username,
    scope,
    scmContext,
    isGuest,
    token
  });
}

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
      .done(jwt =>
        // Add some data from the JWT to the session data
        resolve(getData(jwt.token, decoder(jwt.token)))
      )
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
      const jwt = get(data, 'token');

      if (!isEmpty(jwt)) {
        const decodedJWT = decoder(jwt);

        // Token expired, reject
        if (decodedJWT.exp * 1000 < Date.now()) {
          return reject();
        }

        const authData = getData(jwt, decodedJWT);

        return resolve(authData);
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
