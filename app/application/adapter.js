import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';

export default DS.RESTAdapter.extend({
  namespace: ENV.APP.SDAPI_NAMESPACE,
  host: ENV.APP.SDAPI_HOSTNAME,

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

    finalHash.crossDomain = true;
    finalHash.xhrFields = {
      withCredentials: true
    };

    return this._super(url, method, finalHash);
  }
});
