import Ember from 'ember';
import { parse, getCheckoutUrl } from '../../utils/git';

export default Ember.Component.extend({
  // Updating a pipeline
  init() {
    this._super(...arguments);
    this.set('scmUrl', getCheckoutUrl({
      appId: this.get('pipeline.appId'),
      scmUri: this.get('pipeline.scmUri')
    }));
  },
  errorMessage: '',
  scmUrl: '',
  isValid: Ember.computed('scmUrl', {
    get() {
      const val = this.get('scmUrl');

      return val.length !== 0 && parse(val).valid;
    }
  }),
  isInvalid: Ember.computed.not('isValid'),
  isDisabled: Ember.computed.or('isSaving', 'isInvalid'),
  // Removing a pipeline
  isRemoving: false,
  isShowingModal: false,
  showDangerButton: true,
  showRemoveButtons: false,
  // Syncing a pipeline
  sync: Ember.inject.service('sync'),
  actions: {
    // Checks if scm URL is valid or not
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = Ember.$('.text-input');

      input.removeClass('bad-text-input good-text-input');

      if (this.get('isValid')) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }
    },
    updatePipeline() {
      this.get('onUpdatePipeline')(this.get('scmUrl'));
    },
    toggleJob(jobId, event) {
      this.get('setJobStatus')(jobId, event.newValue ? 'DISABLED' : 'ENABLED');
    },
    showRemoveButtons() {
      this.set('showDangerButton', false);
      this.set('showRemoveButtons', true);
    },
    cancelRemove() {
      this.set('showDangerButton', true);
      this.set('showRemoveButtons', false);
    },
    removePipeline() {
      this.set('showRemoveButtons', false);
      this.set('isRemoving', true);
      this.get('onRemovePipeline')();
    },
    sync(syncPath) {
      this.set('isShowingModal', true);

      return this.get('sync').syncRequests(this.get('pipeline.id'), syncPath)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    }
  }
});
