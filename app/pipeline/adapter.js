import Adapter from '../application/adapter';

export default Adapter.extend({
  handleResponse: (status, headers, payload, requestData) => {
    if (payload.error) {
      return Adapter.prototype.handleResponse(status, headers, { errors: payload }, requestData);
    }

    let data = {};
    let key = 'pipeline';

    // Unfortunately, because of the way findHasMany works with links,
    // the parent adapter is used to parse the response instead of the adapter for the record(s) retrieved.
    // This would be completely unnecessary if the api returned either the ids of the items we are looking for,
    // or we had a JSONAPI response format
    if (/\/jobs$/.test(requestData.url)) {
      key = 'job';
    }

    if (/\/secrets$/.test(requestData.url)) {
      key = 'secret';
    }

    // Fix our API not returning the model name in payload
    if (payload && Array.isArray(payload)) {
      data[`${key}s`] = payload;
    } else if (payload) {
      data[key] = payload;
      // Give a link to load secrets from server (will resolve to e.g. 'pipelines/:id/secrets')
      if (key === 'pipeline') {
        data[key].links = {
          secrets: 'secrets',
          jobs: 'jobs'
        };
      }
    }

    // Pass-through to super-class
    return Adapter.prototype.handleResponse(status, headers, data, requestData);
  }
});
