import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

/**
 * Screwdriver Shuttle Service
 * Only certain methods are allowed: get, request, post, put, patch, del, raw
 * Ember Ajax API: https://github.com/ember-cli/ember-ajax
 * @namespace
 * @return
 */
export default Service.extend({
  ajax: service(),

  session: service(),

  storeHost: `${ENV.APP.SDSTORE_HOSTNAME}/${ENV.APP.SDSTORE_NAMESPACE}`,

  apiHost: `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}`,

  headers: computed('session.data.authenticated', {
    get() {
      return {
        Authorization: `Bearer ${this.session.get('data.authenticated.token')}`
      };
    }
  }),

  ajaxOptions() {
    const { headers } = this;

    return {
      contentType: 'application/json; charset=utf-8',
      xhrFields: {
        withCredentials: true
      },
      headers
    };
  },

  fetchFrom(host = 'store', method = 'get', url, data = {}, raw = false) {
    let baseHost = this.apiHost;

    if (host === 'store') {
      baseHost = this.storeHost;
    }

    let optionsType = method.toUpperCase();
    let requestType = method.toLowerCase();

    if (raw) {
      requestType = 'raw';
    }

    if (requestType === 'get') {
      requestType = 'request';
    }

    const uri = `${baseHost}${url}`;

    const options = Object.assign({}, this.ajaxOptions(), {
      data,
      type: optionsType
    });

    return this.get('ajax')[requestType](uri, options);
  },

  fetchFromApi(method = 'get', url, data, raw = false) {
    return this.fetchFrom('api', method, url, data, raw);
  },

  fetchFromStore(method = 'get', url, data, raw = false) {
    return this.fetchFrom('store', method, url, data, raw);
  },

  fetchLogs({ buildId, stepName, logNumber = 0, pageSize = 10, sortOrder = 'ascending' }) {
    const method = 'get';
    const url = `/builds/${buildId}/steps/${stepName}/logs`;
    const data = { from: logNumber, pages: pageSize, sort: sortOrder };
    const raw = true;

    return this.fetchFromApi(method, url, data, raw);
  },

  fetchAllTemplates() {
    const method = 'get';
    const url = `/templates`;
    const data = { sortBy: 'createTime', sort: 'descending', compact: true };

    return this.fetchFromApi(method, url, data);
  }
});
