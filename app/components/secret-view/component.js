import { computed } from '@ember/object';
import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
  tagName: 'tr',
  newValue: null,
  originalAllowInPR: null,
  buttonAction: computed('newValue', 'secret.allowInPR', 'originalAllowInPR', {
    get() {
      const secret = this.get('secret');
      const pipeline = this.get('pipeline');

      if (pipeline.get('configPipelineId')) {
        if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
          return 'Override';
        }

        return (this.get('newValue')
          || this.get('originalAllowInPR') !== this.get('secret.allowInPR')) ?
          'Update' : 'Revert';
      }

      return (this.get('newValue')
        || this.get('originalAllowInPR') !== this.get('secret.allowInPR')) ?
        'Update' : 'Delete';
    }
  }),
  passwordPlaceholder: computed({
    get() {
      const secret = this.get('secret');
      const pipeline = this.get('pipeline');

      if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
        return 'Inherited from parent pipeline';
      }

      return 'Protected';
    }
  }),
  init() {
    this._super(...arguments);
    this.set('originalAllowInPR', this.get('secret.allowInPR'));
  },
  actions: {
    modifySecret() {
      const secret = this.get('secret');

      if (this.get('buttonAction') === 'Delete'
        || this.get('buttonAction') === 'Revert') {
        return secret.destroyRecord().then(() => {
          this.get('secrets').store.unloadRecord(secret);
          this.get('secrets').reload();
        });
      } else if (this.get('buttonAction') === 'Update') {
        if (this.get('newValue')) {
          secret.set('value', this.get('newValue'));
        }
        secret.save();
        this.set('newValue', null);
        this.set('originalAllowInPR', secret.get('allowInPR'));
      } else if (this.get('newValue')) {
        // Create child pipeline secret to override inherited secret of same name
        return this.get('onCreateSecret')(
          secret.get('name'), this.get('newValue'), this.get('pipeline.id'), secret.get('allowInPR')
        );
      }

      return Promise.resolve(null);
    },
    /**
     * Toggle eye-icon and password input type
     * @method togglePasswordInput
     * @param {Object} event Click event
     */
    togglePasswordInput(event) {
      const target = event.target;
      const passwordInput = target.previousSibling;

      $(target).toggleClass('fa-eye fa-eye-slash');

      if ($(passwordInput).attr('type') === 'password') {
        $(passwordInput).attr('type', 'text');
      } else {
        $(passwordInput).attr('type', 'password');
      }
    }
  }
});
