import ENV from 'screwdriver-ui/config/environment';
import BaseAdapter from 'screwdriver-ui/application/adapter';

export default BaseAdapter.extend({
  /**
     * Overriding default adapter in order to query build statuses api.
     * @return {String} url
     */
  urlForQuery(/* query, modelName */) {
    return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/builds/statuses`;
  },
  ajax(url, type, options) {
    if (options) {
      options.traditional = true;
    }

    return this._super(...arguments);
  }
});
