import Ember from 'ember';

export default Ember.Component.extend({
  showDangerButton: true,
  showRemoveButtons: false,
  isRemoving: false,
  actions: {
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
    }
  }
});
