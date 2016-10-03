import Ember from 'ember';

export default Ember.Component.extend({
  showDangerButton: true,
  showRemoveButtons: false,
  isRemoving: false,
  actions: {
    enableJob(jobId) {
      this.get('setJobStatus')(jobId, 'ENABLED');
    },
    disableJob(jobId) {
      this.get('setJobStatus')(jobId, 'DISABLED');
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
    }
  }
});
