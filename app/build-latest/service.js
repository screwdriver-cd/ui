import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Get latest build for given job
   * @method getLatestBuild
   * @param   {Number}  pipelineId
   * @param   {string}  jobName
   * @param   {string}  buildStatus
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  getLatestBuild(pipelineId, jobName, buildStatus) {
    let url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/jobs/${jobName}/latestBuild`;

    console.log(`status at service${buildStatus}`);
    if (buildStatus) {
      url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/jobs/${jobName}/latestBuild?status=${buildStatus}`;
    }

    return new EmberPromise((resolve, reject) => {
      if (!this.get('session.isAuthenticated')) {
        return reject(new Error('User is not authenticated'));
      }

      return $.ajax({
        url,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
        }
      })
        .done(data => {
          // setting pipelineId because build meta data is not a gurantee
          data.pipelineId = pipelineId;

          return resolve(data);
        })
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.message}`;
          }

          return reject(message);
        });
    });
  }
});
