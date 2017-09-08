import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Service.extend({
  getOneTemplate(name) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/templates/${encodeURIComponent(name)}`;

    return this.fetchData(url);
  },
  getAllTemplates() {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/templates`;

    return this.fetchData(url);
  },
  fetchData(url) {
    const ajaxConfig = {
      method: 'GET',
      url,
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    };

    return new Ember.RSVP.Promise((resolve, reject) => {
      // Call the token api to get the session info
      Ember.$.ajax(ajaxConfig)
        .done(content => resolve(content))
        .fail((response) => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          return reject(message);
        });
    });
  }
});
