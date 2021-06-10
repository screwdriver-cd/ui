import ENV from 'screwdriver-ui/config/environment';
import convertToBool from 'screwdriver-ui/utils/convert-to-bool';

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
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SLACK_URL) {
    ENV.APP.SLACK_URL = window.SUPPLEMENTARY_CONFIG.SLACK_URL;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.ROOT_URL) {
    ENV.rootURL = window.SUPPLEMENTARY_CONFIG.ROOT_URL;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.RELEASE_VERSION) {
    ENV.APP.RELEASE_VERSION = window.SUPPLEMENTARY_CONFIG.RELEASE_VERSION;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SHOW_AVATAR) {
    ENV.APP.SHOW_AVATAR = convertToBool(window.SUPPLEMENTARY_CONFIG.SHOW_AVATAR);
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.FEEDBACK_HOSTNAME) {
    ENV.APP.FEEDBACK_HOSTNAME = window.SUPPLEMENTARY_CONFIG.FEEDBACK_HOSTNAME;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.FEEDBACK_SCRIPT) {
    ENV.APP.FEEDBACK_SCRIPT = window.SUPPLEMENTARY_CONFIG.FEEDBACK_SCRIPT;
  }
  if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.FEEDBACK_CONFIG) {
    ENV.APP.FEEDBACK_CONFIG = window.SUPPLEMENTARY_CONFIG.FEEDBACK_CONFIG;
  }
}

export default {
  name: 'supplementary-config',
  initialize
};
