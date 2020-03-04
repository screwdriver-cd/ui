import ENV from 'screwdriver-ui/config/environment';
import BaseAdapter from 'screwdriver-ui/application/adapter';

export default BaseAdapter.extend({
  /**
   * Overriding default adapter in order to pass pagination query params to
   * the pipeline events api.
   * @param  {Object} query
   * @param  {String} modelName
   * @return {String} url
   */
  urlForQuery(query, modelName) {
    // Wont let me commit without using params but params are needed as this function is an override.
    console.log(query);
    console.log(modelName);

    return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/builds/history`;
  },
  ajax(url, type, options) {
    if (options) {
      options.traditional = true;
    }

    return this._super(...arguments);
  }
});
