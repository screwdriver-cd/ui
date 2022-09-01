import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;
import { debounce } from '@ember/runloop';

export default Service.extend({
  session: service('session'),
  store: service(),
  desiredJobNameLength: null,

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

  async getDesiredJobNameLength() {
  // async getActualDesiredJobNameLength() {
    console.log('called getDesiredJobNameLength');
    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    let userPreference = await this.store.peekRecord('preference/user', 1);

    if (userPreference === null) {
      console.log('record is null, querying record');

      userPreference = await this.store.queryRecord('preference/user', {});
    } else {
      console.log('got record');
    }

    if (userPreference) {
      const { displayJobNameLength } = userPreference;

      if (displayJobNameLength > desiredJobNameLength) {
        desiredJobNameLength = displayJobNameLength;
      }
    }

    this.set('desiredJobNameLength', desiredJobNameLength);

    return desiredJobNameLength;
  },

  async updateDisplayJobNameLength(displayJobNameLength) {
    let userPreference = await this.store.peekRecord('preference/user', 1);

    if (userPreference === null) {
      console.log('record is null, querying record');

      userPreference = await this.store.queryRecord('preference/user', {});
    } else {
      console.log('got record');
    }

    userPreference.set('displayJobNameLength', displayJobNameLength);

    try {
      userPreference.save();
    } catch(e) {
      console.error('e', e);
    }

  }
});
