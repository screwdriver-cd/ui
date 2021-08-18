import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Start all child pipelines
   * @method startAll
   * @param   {Number}  pipelineId
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  startAll(pipelineId) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/startall`;

    return new EmberPromise((resolve, reject) => {
      $.ajax({
        url,
        type: 'POST',
        headers: {
          Authorization: `Bearer ${get(
            this,
            'session.data.authenticated.token'
          )}`
        }
      })
        .done(() => resolve())
        .fail((jqXHR) => reject(JSON.parse(jqXHR.responseText).message));
    });
  }
});
