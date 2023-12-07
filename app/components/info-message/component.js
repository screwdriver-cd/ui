import Component from '@ember/component';
import { computed } from '@ember/object';
import { sanitizeString } from 'screwdriver-ui/helpers/sanitize-string';

export default Component.extend({
  type: 'info',
  sanitizedMessgae: computed('message', {
    get() {
      return sanitizeString(this.message);
    }
  }),
  actions: {
    clearMessage: function clearMessage() {
      this.set('message', null);
    },
    authenticate(scmContext) {
      this.session.authenticate('authenticator:screwdriver-api', scmContext);
      this.set('message', null);
    }
  }
});
