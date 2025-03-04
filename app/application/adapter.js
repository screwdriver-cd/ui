import RESTAdapter from '@ember-data/adapter/rest';
import { inject as service } from '@ember/service';
import { pluralize } from 'ember-inflector';
import ENV from 'screwdriver-ui/config/environment';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

// urls are of the form: https://server.com/namespace/key1s/:id/key2s, but :id and key2s are optional
const urlPathParser = new RegExp(
  `/${ENV.APP.SDAPI_NAMESPACE}/([^/]+)(/([^/]+))?(/([^/]+))?`
);

export default RESTAdapter.extend(DataAdapterMixin, {
  session: service('session'),
  namespace: ENV.APP.SDAPI_NAMESPACE,
  host: ENV.APP.SDAPI_HOSTNAME,
  /** Just to override the assertion from `DataAdapterMixin` */
  authorize() {},
  /**
   * Add cors support to all ajax calls
   * @method ajax
   * @param  {String} url    the url for the calls
   * @param  {String} method the type of call eg. GET POST
   * @param  {Object} hash   configuration object for the call
   * @return {Promise}
   */
  ajax(url, method, hash) {
    const finalHash = hash || {};

    finalHash.credentials = 'include';
    finalHash.crossDomain = true;

    return this._super(url, method, finalHash);
  },

  get headers() {
    return {
      Authorization: `Bearer ${this.session.get('data.authenticated.token')}`
    };
  },

  /**
   * Interface for adding content to a payload before handleResponse is complete
   * Ideally, this could be handled by a model specific adapter or serializer, but Ember doesn't use
   * the correct [foo] adapter when making calls to /pipeline/:id/foo
   * @method decoratePayload
   * @param  {String}   key       Descriptor of model name
   * @param  {Object}   payload   Raw response object
   * @private
   */
  decoratePayload(key, payload) {
    if (Array.isArray(payload[key])) {
      payload[key].map(o => this.insertLink(key, o));
    } else {
      this.insertLink(key, payload[key]);
    }
  },

  /**
   * Insert links configuration into responses for child data. Modifies object in place.
   * @method insertLink
   * @param  {String}   key   Descriptor of model name
   * @param  {Object}   [o]   Response object for model
   * @private
   */
  insertLink(key, o) {
    if (!o) {
      return;
    }

    if (key === 'pipeline' || key === 'pipelines') {
      o.links = {
        events: 'events',
        jobs: 'jobs',
        secrets: 'secrets',
        tokens: 'tokens',
        metrics: 'metrics',
        stages: 'stages'
      };
    } else if (key === 'event' || key === 'events') {
      o.links = {
        builds: 'builds',
        stageBuilds: 'stageBuilds'
      };
    } else if (key === 'job' || key === 'jobs') {
      o.links = {
        builds: 'builds?count=10&page=1',
        metrics: 'metrics'
      };
    }
  },

  /**
   * Overriding default adapter because our API doesn't provide model names around request data
   * https://github.com/emberjs/data/blob/v2.7.0/addon/adapters/rest.js#L883
   * @method handleResponse
   * @param  {Number}       status      response status
   * @param  {Object}       headers     response headers
   * @param  {Object}       payload     response payload
   * @param  {Object}       requestData original request info
   * @return {Object | DS.AdapterError} response
   */
  handleResponse(status, headers, payload, requestData) {
    // handle generically when there is an error key in the payload
    // Convert our errors to JSONAPI format [required in ember-data 2.13]
    if (payload && payload.error) {
      let errors = payload.error;

      if (typeof errors === 'string') {
        errors = [
          {
            status: payload.statusCode,
            title: payload.error,
            detail: payload.message,
            data: payload.data
          }
        ];
      }

      if (typeof errors === 'object' && !Array.isArray(errors)) {
        errors = [
          {
            status: errors.statusCode,
            title: errors.error,
            detail: errors.message
          }
        ];
      }

      // Rewrite the error message for guest users
      errors = errors.map(err => {
        if (err.detail === 'Insufficient scope') {
          err.detail =
            'You do not have adequate permissions to perform this action.';
        }

        return err;
      });

      return this._super(status, headers, { errors }, requestData);
    }

    const data = {};

    let key;

    const requestUrl = new URL(requestData.url);
    const matches = requestUrl.pathname.match(urlPathParser);

    // catch if we got a really weird url
    if (!matches) {
      // bail
      return this._super(...arguments);
    }

    if (this.modelKey) {
      key = this.modelKey;
    } else {
      // the last key on the path and remove the s at the end
      key = matches[5] || matches[1];
      key = key.substr(0, key.length - 1);
    }

    // Fix our API not returning the model name in payload
    if (payload && Array.isArray(payload)) {
      key = `${key}s`;
      data[key] = payload;
    } else if (payload) {
      data[key] = payload;
    }
    this.decoratePayload(key, data);

    // Pass-through to super-class
    return this._super(status, headers, data, requestData);
  },
  /**
   * Overriding default adapter because pipeline token's endpoint is differnt
   * from user api token.
   * @method urlForFindAll
   * @param  {String}      modelName
   * @param  {Object}      snapshot
   * @return {String}      url
   */
  urlForFindAll(modelName, snapshot) {
    if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
      return this._super(modelName, snapshot);
    }

    return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${snapshot.adapterOptions.pipelineId}/tokens`;
  },
  /**
   * Overriding default adapter because pipeline token's endpoint is differnt
   * from user api token.
   * @method urlForCreateRecord
   * @param  {String}      modelName
   * @param  {Object}      snapshot
   * @return {String}      url
   */
  urlForCreateRecord(modelName, snapshot) {
    if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
      return this._super(modelName, snapshot);
    }

    return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/pipelines/${snapshot.adapterOptions.pipelineId}/tokens`;
  },
  /**
   * Overriding default adapter because pipeline token's endpoint is differnt
   * from user api token.
   * @method urlForUpdateRecord
   * @param  {String}      id
   * @param  {String}      modelName
   * @param  {Object}      snapshot
   * @return {String}      url
   */
  urlForUpdateRecord(id, modelName, snapshot) {
    if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
      return this._super(id, modelName, snapshot);
    }

    return (
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/pipelines/${snapshot.adapterOptions.pipelineId}/tokens/${id}`
    );
  },
  /**
   * Overriding default adapter because pipeline token's endpoint is differnt
   * from user api token.
   * @method urlForDeleteRecord
   * @param  {String}      id
   * @param  {String}      modelName
   * @param  {Object}      snapshot
   * @return {String}      url
   */
  urlForDeleteRecord(id, modelName, snapshot) {
    if (
      modelName !== 'token' ||
      snapshot.adapterOptions.pipelineId === undefined
    ) {
      return this._super(id, modelName, snapshot);
    }

    return (
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/pipelines/${snapshot.adapterOptions.pipelineId}/tokens/${id}`
    );
  },
  /**
   * Overriding default adapter in order to pass pagination query params to
   * the pipeline events api.
   * @param  {Object} query
   * @param  {String} modelName
   * @return {String} url
   */
  urlForQuery(query, modelName) {
    if (modelName === 'event' || modelName === 'metric') {
      const { pipelineId, jobId } = query;

      delete query.pipelineId;
      delete query.jobId;

      // eslint-disable-next-line prefer-template
      return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}${
        pipelineId ? `/pipelines/${pipelineId}` : `/jobs/${jobId}`
      }/${pluralize(modelName)}`;
    }

    return this._super(...arguments);
  }
});
