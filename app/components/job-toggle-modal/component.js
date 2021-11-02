import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { schedule } from '@ember/runloop';

@tagName('')
@classic
export default class JobToggleModal extends Component {
  message = null;

  errorMessage = null;

  @service
  store;

  @action
  setModal(open) {
    if (!open) {
      this.set('message', null);
      this.set('errorMessage', null);
    }
    this.set('showToggleModal', open);
  }

  @action
  updateState() {
    schedule('actions', () => {
      let addMessage = this.updateMessage;

      if (addMessage) {
        addMessage(this.message);
      }

      this.set('showToggleModal', false);
    });
  }
}
