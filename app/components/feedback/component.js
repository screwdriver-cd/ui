import Component from '@ember/component';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  didInsertElement() {
    if (
      ENV.APP.FEEDBACK_HOSTNAME &&
      ENV.APP.FEEDBACK_SCRIPT &&
      ENV.APP.FEEDBACK_CONFIG
    ) {
      $.getScript(ENV.APP.FEEDBACK_SCRIPT, () => {
        const { objName, version, params } = JSON.parse(
          ENV.APP.FEEDBACK_CONFIG
        );

        setTimeout(() => {
          window[objName][version](params);
        }, 2000);
      });
    }
  }
});
