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
        const message = this.get('message');
        let addMessage = this.get('updateMessage');

        console.log('in jog toggle updateState method');

        if (addMessage) {
          addMessage(message);
        }

        this.set('showToggleModal', false);
      });
    }
  }
});
