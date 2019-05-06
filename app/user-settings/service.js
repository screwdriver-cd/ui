import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),
  refreshToken(id) {
    const token = get(this, 'session.data.authenticated.token');

    return new EmberPromise((resolve, reject) => {
      $.ajax({
        url: `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/tokens/${id}/refresh`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        }
      })
        .done(content => resolve(Object.assign(content, { action: 'refreshed' })))
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON) {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          return reject(message);
        });
    });
  }
});
