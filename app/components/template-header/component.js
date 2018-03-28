import Component from '@ember/component';

export default Component.extend({
  templateToRemove: null,
  isRemoving: false,
  init() {
    this._super(...arguments);
  },
  actions: {
    setTemplateToRemove(template) {
      this.set('templateToRemove', template);
    },
    cancelRemovingTemplate() {
      this.set('templateToRemove', null);
      this.set('isRemoving', false);
    },
    removeTemplate(name) {
      this.set('isRemoving', true);
      this.get('onRemoveTemplate')(name).then(() => {
        this.set('templateToRemove', null);
        this.set('isRemoving', false);
      });
    }
  }
});
