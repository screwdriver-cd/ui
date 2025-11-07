import Pretender from 'pretender';
import config from 'screwdriver-ui/config/environment';
import { noBanners } from './pretender/banners';
import { buildRoutes } from './pretender/builds';
import { eventRoutes } from './pretender/events';
import { pipelineRoutes } from './pretender/pipelines';
import { userSettingRoute } from './pretender/userSettings';

const API_BASE_URL = `${config.APP.SDAPI_HOSTNAME}/${config.APP.SDAPI_NAMESPACE}`;

// eslint-disable-next-line import/prefer-default-export
export class MockApi {
  pretender;

  newPretenderServer() {
    this.pretender = new Pretender();

    this.pretender.prepareHeaders = headers => {
      headers['content-type'] = 'application/json';

      return headers;
    };

    this.pretender.prepareBody = body => {
      return body ? JSON.stringify(body) : '';
    };

    noBanners(this);
    userSettingRoute(this);
    pipelineRoutes(this);
    eventRoutes(this);
    buildRoutes(this);
  }

  _getApiUrl(endpoint) {
    return endpoint.startsWith('/')
      ? `${API_BASE_URL}${endpoint}`
      : `${API_BASE_URL}/${endpoint}`;
  }

  get(endpoint, handler) {
    this.pretender.get(this._getApiUrl(endpoint), request => {
      return new Promise(resolve => {
        const [responseCode, responseBody] = handler(request);

        resolve([responseCode, {}, responseBody]);
      });
    });
  }

  post(endpoint, handler) {
    this.pretender.post(this._getApiUrl(endpoint), request => {
      return new Promise(resolve => {
        const [responseCode, responseBody] = handler(request);

        resolve([responseCode, {}, responseBody]);
      });
    });
  }

  put(endpoint, handler) {
    this.pretender.put(this._getApiUrl(endpoint), request => {
      return new Promise(resolve => {
        const [responseCode, responseBody] = handler(request);

        resolve([responseCode, {}, responseBody]);
      });
    });
  }
}
