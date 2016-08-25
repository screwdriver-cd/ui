import Adapter from '../application/adapter';
export default Adapter.extend({
  host: 'http://localhost:8080',

  handleResponse: function (status, headers, payload, requestData) {
    // Fix our API not returning the model name in payload
    if (payload && Array.isArray(payload)) {
      payload = { builds: payload };
    } else if (payload) {
      payload = { build: payload };
    }

    // Pass-through to super-class
    return Adapter.prototype.handleResponse(status, headers, payload, requestData);
  }
});
