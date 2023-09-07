import Component from '@ember/component';

export default Component.extend({
  showDeleteConfirmation: false,

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
