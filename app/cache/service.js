import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Calls the store api service to clear the cache data
   * @method clearCache
   * @param   {Object}  config
   * @param   {String}  config.cacheId     The ID of event, or job to clear the cache from
   * @param   {String}  config.pipelineId  The ID of the pipeline
   * @param   {String}  config.scope       The scope of the cache, e.g. pipelines, events, jobs
   * @return  {Promise}                    Resolve nothing if success otherwise reject with error message
   */
  clearCache(config) {
    const { scope, pipelineId, cacheId } = config;

    let url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${pipelineId}/caches`;

    url = url.concat(`?scope=${scope}&cacheId=${cacheId}`);

    const ajaxConfig = {
      url,
      type: 'DELETE',
      contentType: 'application/json',
      crossDomain: true,
      headers: {
        Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
      }
    };

    return new EmberPromise((resolve, reject) => {
      $.ajax(ajaxConfig)
        .done(content => resolve(content))
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          if (response.status === 401) {
            message = 'You do not have the permissions to clear the cache.';
          }

          return reject(message);
        });
    });
  }
});
