import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Service.extend({
  session: Ember.inject.service('session'),

  /**
   * Calls the sync api service to sync data
   * @method syncRequests
   * @param   {Number}  pipelineId
   * @param   {String}  syncPath   The path for the data to sync, e.g. webhooks, pullrequests
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  syncRequests(pipelineId, syncPath = '') {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/pipelines/${pipelineId}/sync/${syncPath}`;

    return new Ember.RSVP.Promise((resolve, reject) => {
      Ember.$.ajax({
        url,
        type: 'POST',
        headers: {
          Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}`
        }
      })
      .done(() => resolve())
      .fail(jqXHR => reject(JSON.parse(jqXHR.responseText).message));
    });
  }
});
