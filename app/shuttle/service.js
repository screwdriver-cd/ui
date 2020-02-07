import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

const ALLOWED_METHODS = {
  get: 'request',
  request: 'request',
  post: 'post',
  put: 'put',
  patch: 'patch',
  delete: 'del',
  del: 'del',
  raw: 'raw'
};

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
    let actualMethod = method.toLowerCase();

    if (host === 'store') {
      baseHost = this.storeHost;
    }

    const options = this.ajaxOptions();

    if (raw) {
      actualMethod = 'raw';
    }

    const httpMethod = ALLOWED_METHODS[actualMethod];

    if (httpMethod === 'post') {
      options.data = JSON.stringify(data);
    }

    let uri = `${baseHost}/${url}`;

    if (url.startsWith('/')) {
      uri = `${baseHost}${url}`;
    }

    return this.get('ajax')[httpMethod](uri, options);
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
  }
});
