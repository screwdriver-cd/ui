import ENV from 'screwdriver-ui/config/environment';

/**
 * initializer function to replace configuration with custom info
 * @method initialize
 */
export function initialize() {
  const externalConfig = window.SUPPLEMENTARY_CONFIG;

  if (externalConfig) {
    if (externalConfig.SDAPI_HOSTNAME) {
      ENV.APP.SDAPI_HOSTNAME = externalConfig.SDAPI_HOSTNAME;
    }
    if (externalConfig.SDAPI_NAMESPACE) {
      ENV.APP.SDAPI_NAMESPACE = externalConfig.SDAPI_NAMESPACE;
    }
    if (externalConfig.SDSTORE_HOSTNAME) {
      ENV.APP.SDSTORE_HOSTNAME = externalConfig.SDSTORE_HOSTNAME;
    }
    if (externalConfig.SDSTORE_NAMESPACE) {
      ENV.APP.SDSTORE_HOSTNAME = externalConfig.SDSTORE_NAMESPACE;
    }
    if (externalConfig.FEAT_DISPLAY_ALPHA) {
      ENV.APP.FEAT_DISPLAY_ALPHA = externalConfig.FEAT_DISPLAY_ALPHA;
    }
  }
}

export default {
  name: 'supplementary-config',
  initialize
};
