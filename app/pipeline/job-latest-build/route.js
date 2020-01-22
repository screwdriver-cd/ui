import $ from 'jquery';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import ENV from 'screwdriver-ui/config/environment';

/**
 * Get latest build for given job
 * @method getLatestBuild
 * @param   {object}  session
 * @param   {Number}  pipelineId
 * @param   {string}  jobName
 * @param   {string}  buildStatus
 * @return  {Promise}            Resolve nothing if success otherwise reject with error message
 */
function getLatestBuild(session, pipelineId, jobName, buildStatus) {
  let url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/jobs/${jobName}/latestBuild`;

  if (buildStatus) {
    url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/jobs/${jobName}/latestBuild?status=${buildStatus}`;
  }

  return new EmberPromise((resolve, reject) => {
    if (!session.isAuthenticated) {
      return reject(new Error('User is not authenticated'));
    }

    return $.ajax({
      url,
      type: 'GET',
      headers: {
        Authorization: `Bearer ${session.data.authenticated.token}`
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

export default Route.extend({
  latestBuildService: service('build-latest'),
  session: service('session'),
  queryParams: {
    status: ''
  },
  model(params, transition) {
    const pipelineId = transition.params.pipeline.pipeline_id;
    const { job_name: jobName, status: buildStatus } = params;

    // todo: move build-latest service to this file
    return getLatestBuild(this.get('session'), pipelineId, jobName, buildStatus);
  }
});
