import ENV from 'screwdriver-ui/config/environment';

/**
 * initializer function to replace configuration with custom info
 * @method initialize
 */
export function initialize() {
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDAPI_HOSTNAME) {
    ENV.APP.SDAPI_HOSTNAME = window.SUPPLEMENTARY_CONFIG.SDAPI_HOSTNAME;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDAPI_NAMESPACE) {
    ENV.APP.SDAPI_NAMESPACE = window.SUPPLEMENTARY_CONFIG.SDAPI_NAMESPACE;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDSTORE_HOSTNAME) {
    ENV.APP.SDSTORE_HOSTNAME = window.SUPPLEMENTARY_CONFIG.SDSTORE_HOSTNAME;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDSTORE_NAMESPACE) {
    ENV.APP.SDSTORE_NAMESPACE = window.SUPPLEMENTARY_CONFIG.SDSTORE_NAMESPACE;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDDOC_URL) {
    ENV.APP.SDDOC_URL = window.SUPPLEMENTARY_CONFIG.SDDOC_URL;
  }
}

export default {
  name: 'supplementary-config',
  initialize
};
