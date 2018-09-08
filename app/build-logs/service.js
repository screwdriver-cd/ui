import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),
  /**
   * Calls the logs api service to fetch logs
   * @method fetchLogs
   * @param  {Object}  config                         config for fetching logs
   * @param  {String}  config.buildId                 sha representing a build id
   * @param  {String}  config.stepName                name of a step
   * @param  {Number}  [config.logNumber=0]           The line number to start from
   * @param  {Number}  [config.pageSize=10]           The number of pages to load
   * @param  {String}  [config.sortOrder='ascending'] The sort order. 'ascending' | 'descending'
   * @return {Promise}                                Resolves to { lines, done }
   */
  fetchLogs({ buildId, stepName, logNumber = 0, pageSize = 10, sortOrder = 'ascending' }) {
    let lines = [];
    let done = false;

    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/builds/${buildId}/steps/${stepName}/logs`;

    return new EmberPromise((resolve, reject) => {
      if (!this.get('session.isAuthenticated')) {
        return reject(new Error('User is not authenticated'));
      }

      // convert jquery's ajax promises to a real promise
      return $.ajax({
        url,
        data: { from: logNumber, pages: pageSize, sort: sortOrder },
        headers: {
          Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}`
        }
      })
        .done((data, textStatus, jqXHR) => {
          if (Array.isArray(data)) {
            lines = data;
          }
          done = jqXHR.getResponseHeader('x-more-data') === 'false';
        })
        // always resolve something
        .always(() => resolve({
          lines,
          done
        }));
    });
  }
});
