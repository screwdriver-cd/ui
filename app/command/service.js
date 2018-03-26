import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  getOneCommand(namespace, name) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/` +
      `${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

    return this.fetchData(url);
  },
  getAllCommands() {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands`;

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

    return new EmberPromise((resolve, reject) => {
      $.ajax(ajaxConfig)
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
