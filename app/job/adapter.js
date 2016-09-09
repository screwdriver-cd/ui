import Adapter from '../application/adapter';
export default Adapter.extend({
  handleResponse: (status, headers, payload, requestData) => {
    let data = payload;

    // Fix our API not returning the model name in payload
    if (data && Array.isArray(data)) {
      data = { jobs: data };
    } else if (data) {
      data = { job: data };
    }

    // Pass-through to super-class
    return Adapter.prototype.handleResponse(status, headers, data, requestData);
  }
});
