import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
const { MINIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Service.extend({
  session: service('session'),
  store: service(),
  desiredJobNameLength: null,
  desiredTimestampFormat: null,

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
        .done(content =>
          resolve(Object.assign(content, { action: 'refreshed' }))
        )
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON) {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          return reject(message);
        });
    });
  },

  async getUserPreference() {
    let userPreference = await this.store.peekRecord('preference/user', 1);

    if (userPreference === null) {
      userPreference = await this.store.queryRecord('preference/user', {});
    }

    return userPreference;
  },

  async getDisplayJobNameLength() {
    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    const userPreference = await this.getUserPreference();

    if (userPreference) {
      const { displayJobNameLength } = userPreference;

      if (displayJobNameLength > desiredJobNameLength) {
        desiredJobNameLength = displayJobNameLength;
      }
    }

    this.set('desiredJobNameLength', desiredJobNameLength);

    return desiredJobNameLength;
  },

  async getTimestampFormat() {
    let desiredTimestampFormat = 'LOCAL_TIMEZONE';

    const userPreference = await this.getUserPreference();

    if (userPreference) {
      const { timestampFormat } = userPreference;

      desiredTimestampFormat = timestampFormat;
    }

    this.set('desiredTimestampFormat', desiredTimestampFormat);

    return desiredTimestampFormat;
  },

  async updateDisplayJobNameLength(displayJobNameLength) {
    const userPreference = await this.getUserPreference();

    userPreference.set('displayJobNameLength', displayJobNameLength);

    try {
      userPreference.save();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('e', e);
    }
  }
});
