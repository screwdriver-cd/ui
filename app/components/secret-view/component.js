import { computed, get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: 'tr',
  newValue: null,
  originalAllowInPR: null,
  eyeSlash: false,
  buttonAction: computed('newValue', 'secret.allowInPR', 'originalAllowInPR', {
    get() {
      const { secret, pipeline } = this;

      if (get(pipeline, 'configPipelineId')) {
        if (get(secret, 'pipelineId') === get(pipeline, 'configPipelineId')) {
          return 'Override';
        }

        return this.newValue ||
          this.originalAllowInPR !== this.get('secret.allowInPR')
          ? 'Update'
          : 'Revert';
      }

      return this.newValue ||
        this.originalAllowInPR !== this.get('secret.allowInPR')
        ? 'Update'
        : 'Delete';
    }
  }),
  passwordPlaceholder: computed({
    get() {
      const { secret, pipeline } = this;

      if (get(secret, 'pipelineId') === get(pipeline, 'configPipelineId')) {
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
      const { secret } = this;

      if (this.buttonAction === 'Delete' || this.buttonAction === 'Revert') {
        this.set('secretToRemove', true);

        return Promise.resolve(null);
      }
      if (this.buttonAction === 'Update') {
        if (this.newValue) {
          secret.set('value', this.newValue);
        }
        secret.save();
        this.set('newValue', null);
        this.set('originalAllowInPR', get(secret, 'allowInPR'));
      } else if (this.newValue) {
        // Create child pipeline secret to override inherited secret of same name
        return this.onCreateSecret(
          get(secret, 'name'),
          this.newValue,
          this.get('pipeline.id'),
          get(secret, 'allowInPR')
        );
      }

      return Promise.resolve(null);
    },
    /**
     * Toggle eye-icon and password input type
     * @method togglePasswordInput
     * @param {Object} event Click event
     */
    togglePasswordInput() {
      this.set('eyeSlash', !this.eyeSlash);
    },
    removeSecret() {
      const { secret } = this;

      return secret.destroyRecord().then(() => {
        this.secrets.store.unloadRecord(secret);
        this.secrets.reload();
      });
    },
    cancelRemovingSecret() {
      this.set('secretToRemove', null);
      this.set('isRemoving', false);
    }
  }
});
