import ENV from 'screwdriver-ui/config/environment';
import BaseAdapter from 'screwdriver-ui/application/adapter';

export default BaseAdapter.extend({
  /**
     * @param  {Object} query
     * @param  {String} modelName
     * @return {String} url
     */
  urlForQueryRecord(query, modelName) {
    return `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/builds/latest`;
  }
});
