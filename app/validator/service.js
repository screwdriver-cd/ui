import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),
  /**
   * Simple test to determine if yaml looks like a template file
   * @method isTemplate
   * @param  {String}   yaml Raw yaml text
   * @return {Boolean}
   */
  isTemplate(yaml) {
    return /^name|\nname: |\nnamespace: /.test(yaml);
  },

  /**
   * Cross-domain communication to validation endpoints
   * @method getValidationResults
   * @param {String} yaml           yaml payload
   * @return {Promise}
   */
  getValidationResults(yaml) {
    let url = `${ENV.APP.SDAPI_HOSTNAME}/v4/validator`;

    if (this.isTemplate(yaml)) {
      url += '/template';
    }

    const ajaxConfig = {
      method: 'post',
      url,
      headers: {
        Authorization: 'Bearer token1234'
      },
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      data: JSON.stringify({ yaml })
    };

    return new EmberPromise((resolve, reject) => {
      // Call the token api to get the session info
      $.ajax(ajaxConfig)
        .done(content => resolve(content))
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
