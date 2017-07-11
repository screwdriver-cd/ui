import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Service.extend({
  session: Ember.inject.service('session'),
  refreshToken(id) {
    const token = this.get('session').get('data.authenticated.token');

    return new Ember.RSVP.Promise((resolve, reject) => {
      Ember.$.ajax({
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
      .done(content => resolve(content))
      .fail((response) => {
        let message = `${response.status} Request Failed`;

        if (response && response.responseJSON) {
          message = `${response.status} ${response.responseJSON.error}`;
        }

        return reject(message);
      });
    });
  }
});
