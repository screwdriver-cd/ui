import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  showDeleteConfirmation: false,

  deleteAllowed: computed('record.actions.isAdmin', {
    get() {
      return this.get('record.actions.isAdmin');
    }
  }),

  deleteButtonClass: computed('record.actions.isAdmin', {
    get() {
      return this.get('record.actions.isAdmin') ? '' : 'clicks-disabled';
    }
  }),

  actions: {
    showDeleteConfirmation() {
      this.set('showDeleteConfirmation', true);
    },
    cancelDelete() {
      this.set('showDeleteConfirmation', false);
    },
    deleteVersion() {
      const { actions } = this.record;

      this.set('showDeleteConfirmation', false);
      actions.removeVersion(actions.fullName, actions.version);
    }
  }
});
