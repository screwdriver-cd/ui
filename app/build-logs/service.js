import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Service.extend({
  /**
   * Calls the logs api service to fetch logs
   * @method fetchLogs
   * @param  {String}  buildId       sha representing a build id
   * @param  {String}  stepName      name of a step
   * @param  {Number}  [logNumber=0] The line number to start from
   * @return {Promise}               Resolves to { lines, done }
   */
  fetchLogs(buildId, stepName, logNumber = 0) {
    let lines = [];
    let done = false;

    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/builds/${buildId}/steps/${stepName}/logs`;

    return new Ember.RSVP.Promise((resolve) => {
      // convert jquery's ajax promises to a real promise
      Ember.$.ajax({ url, data: { from: logNumber } })
        .done((data, textStatus, jqXHR) => {
          // convert log lines ansi to html colors
          if (Array.isArray(data) && data.length) {
            data.forEach((line) => { line.m = ansi_up.ansi_to_html(line.m); });
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
