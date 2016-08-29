import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';

export default DS.RESTAdapter.extend({
  namespace: ENV.APP.SDAPI_NAMESPACE,
  host: ENV.APP.SDAPI_HOSTNAME
});
