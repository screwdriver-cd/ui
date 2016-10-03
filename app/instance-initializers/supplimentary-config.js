import ENV from 'screwdriver-ui/config/environment';

/**
 * initializer function to replace configuration with custom info
 * @method initialize
 */
export function initialize() {
  if (window.SUPPLIMENTARY_CONFIG && window.SUPPLIMENTARY_CONFIG.SDAPI_HOSTNAME) {
    ENV.APP.SDAPI_HOSTNAME = window.SUPPLIMENTARY_CONFIG.SDAPI_HOSTNAME;
  }
  if (window.SUPPLIMENTARY_CONFIG && window.SUPPLIMENTARY_CONFIG.SDAPI_NAMESPACE) {
    ENV.APP.SDAPI_NAMESPACE = window.SUPPLIMENTARY_CONFIG.SDAPI_NAMESPACE;
  }
}

export default {
  name: 'supplimentary-config',
  initialize
};
