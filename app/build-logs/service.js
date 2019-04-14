import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import { get, set } from '@ember/object';

export default Service.extend({
  session: service(),
  cache: Object.create(null),
  blobKeys: [],
  /**
   * Calls the logs api service to fetch logs
   * @method fetchLogs
   * @param  {Object}  config                         config for fetching logs
   * @param  {String}  config.buildId                 sha representing a build id
   * @param  {String}  config.stepName                name of a step
   * @param  {Number}  [config.logNumber=0]           The line number to start from
   * @param  {Number}  [config.pageSize=10]           The number of pages to load
   * @param  {String}  [config.sortOrder='ascending'] The sort order. 'ascending' | 'descending'
   * @param  {String}  [config.started=false]         Is step started
   * @return {Promise}                                Resolves to { lines, done }
   */
  fetchLogs({
    buildId,
    stepName,
    logNumber = 0,
    pageSize = 10,
    sortOrder = 'ascending',
    started = false
  }) {
    let lines = [];
    let done = false;
    const inProgress = sortOrder === 'ascending';
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/builds/${buildId}/steps/${stepName}/logs`;

    return new EmberPromise((resolve, reject) => {
      if (!this.get('session.isAuthenticated')) {
        return reject(new Error('User is not authenticated'));
      }

      // convert jquery's ajax promises to a real promise
      return (
        $.ajax({
          url,
          data: {
            from: logNumber,
            pages: pageSize,
            sort: sortOrder
          },
          headers: {
            Authorization: `Bearer ${this.session.get('data.authenticated.token')}`
          }
        })
          .done((data, textStatus, jqXHR) => {
            if (Array.isArray(data)) {
              lines = data;
            }
            done = started && jqXHR.getResponseHeader('x-more-data') === 'false';
          })
          // always resolve something
          .always(() => {
            this.setCache(buildId, stepName, { done });

            if (lines.length) {
              let existings = this.getCache(buildId, stepName, 'logs') || [];

              this.setCache(buildId, stepName, {
                nextLine: inProgress ? lines[lines.length - 1].n + 1 : lines[0].n - 1,
                logs: inProgress ? existings.concat(lines) : lines.concat(existings)
              });
            }

            resolve({ lines, done });
          })
      );
    });
  },
  /**
   * Set data at specified key on the cache
   * @method setCache
   *
   * @param {String} buildId
   * @param {String} stepName
   * @param {Object} data
   */
  setCache(buildId, stepName, data) {
    set(this, `cache.${buildId}/${stepName}`, {
      ...get(this, `cache.${buildId}/${stepName}`),
      ...data
    });
  },
  /**
   * Get data by key on the cache
   * @method getCache
   *
   * @param {String} buildId
   * @param {String} stepName
   * @param {String} field
   */
  getCache(buildId, stepName, field) {
    return get(this, `cache.${buildId}/${stepName}.${field}`);
  },

  /**
   * Empty the cache
   * @method resetCache
   */
  resetCache() {
    this.revokeLogBlobUrls();
    set(this, 'cache', Object.create(null));
  },
  /**
   * Create Object URL from the blob generated by the log data in cache
   * @method buildLogBlobUrl
   *
   * @param {String} buildId
   * @param {String} stepName
   * @returns {DOMString}
   */
  buildLogBlobUrl(buildId, stepName) {
    let blobUrl = this.getCache(buildId, stepName, 'blobUrl');

    if (!blobUrl) {
      const blob = new Blob(this.getCache(buildId, stepName, 'logs').map(l => `${l.m}\n`), {
        type: 'text/plain'
      });

      blobUrl = URL.createObjectURL(blob);

      this.setCache(buildId, stepName, { blobUrl });
      this.blobKeys.push([buildId, stepName]);
    }

    return blobUrl;
  },
  /**
   * Revoke the Object URLs
   * @method revokeLogBlobUrls
   */
  revokeLogBlobUrls() {
    this.blobKeys.forEach(k => {
      URL.revokeObjectURL(this.getCache(...k, 'blobUrl'));
      this.setCache(...k, { blobUrl: undefined });
    });
    set(this, 'blobKeys', []);
  }
});
