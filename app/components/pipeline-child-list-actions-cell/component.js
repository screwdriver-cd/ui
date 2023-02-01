import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  showDeleteConfirmation: false,
  deleteAllowed: computed('pipeline.state', {
    get() {
      return this.get('pipeline.state') === 'INACTIVE';
    }
  }),
  actions: {
    deletePipeline() {
      this.onDeletePipeline(this.get('pipeline'));
    },
    showDeleteConfirmation() {
      this.set('showDeleteConfirmation', true);
    },
    cancelDelete() {
      this.set('showDeleteConfirmation', false);
    }
  }
});
