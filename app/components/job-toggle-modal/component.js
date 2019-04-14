import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { schedule } from '@ember/runloop';

export default Component.extend({
  message: null,
  errorMessage: null,
  store: service(),
  actions: {
    setModal(open) {
      if (!open) {
        this.set('message', null);
        this.set('errorMessage', null);
      }
      this.set('showToggleModal', open);
    },
    updateState() {
      schedule('actions', () => {
        const message = this.message;
        let addMessage = this.updateMessage;

        if (addMessage) {
          addMessage(message);
        }

        this.set('showToggleModal', false);
      });
    }
  }
});
