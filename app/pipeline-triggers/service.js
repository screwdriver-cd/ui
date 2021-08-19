import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Get all downstream triggers for jobs in a pipeline
   * @method getDownstreamTriggers
   * @param   {Number}  pipelineId
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  getDownstreamTriggers(pipelineId) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/triggers`;

    return new EmberPromise((resolve, reject) => {
      $.ajax({
        url,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${get(
            this,
            'session.data.authenticated.token'
          )}`
        }
      })
        .done(data => resolve(data))
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (
            response &&
            response.responseJSON &&
            typeof response.responseJSON === 'object'
          ) {
            message = `${response.status} ${response.responseJSON.message}`;
          }

          return reject(message);
        });
    });
  }
});
