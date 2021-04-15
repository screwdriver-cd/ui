import Component from '@ember/component';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  didInsertElement() {
    if (ENV.APP.FEEDBACK_HOSTNAME && ENV.APP.FEEDBACK_OWNER_EMAIL && ENV.APP.FEEDBACK_OWNER_NAME) {
      const scriptSrc = `${ENV.APP.FEEDBACK_HOSTNAME}/api.js`;

      $.getScript(scriptSrc, () => {
        setTimeout(() => {
          // eslint-disable-next-line no-undef
          feedbackWidget.v1({
            ownerEmail: ENV.APP.FEEDBACK_OWNER_EMAIL,
            ownerName: ENV.APP.FEEDBACK_OWNER_NAME,
            formHeader:
              ENV.APP.FEEDBACK_FORM_HEADER || 'Would you recommend Screwdriver to a friend?'
          });
        }, 2000);
      });
    }
  }
});
