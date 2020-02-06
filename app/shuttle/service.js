import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

const ALLOWED_METHODS = {
  get: 'get',
  request: 'get',
  post: 'post',
  put: 'put',
  patch: 'patch',
  delete: 'del',
  del: 'del'
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

  fetchFrom(host = 'store', method = 'get', url, data) {
    let baseHost = this.apiHost;

    if (host === 'store') {
      baseHost = this.storeHost;
    }

    const options = this.ajaxOptions();

    const httpMethod = ALLOWED_METHODS[method.toLowerCase()];

    if (httpMethod === 'post') {
      options.data = JSON.stringify(data);
    }

    const uri = `${baseHost}/${url}`;

    return this.get('ajax')[httpMethod](uri, options);
  },

  fetchFromApi(method = 'get', url, data) {
    return this.fetchFrom('api', method, url, data);
  },

  fetchFromStore(method = 'get', url, data) {
    return this.fetchFrom('store', method, url, data);
  }
});
