import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),
  /**
   * Calls the logs api service to fetch logs
   * @method fetchLogs
   * @param  {String}  buildId              sha representing a build id
   * @param  {String}  stepName             name of a step
   * @param  {Number}  [logNumber=0]        The line number to start from
   * @param  {Number}  [pagesToLoad=10]     The number of pages to load
   * @return {Promise}                      Resolves to { lines, done }
   */
  fetchLogs(buildId, stepName, logNumber = 0, pagesToLoad = 10) {
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
        data: { from: logNumber, pages: pagesToLoad },
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
