import Component from '@ember/component';

export default Component.extend({
  isOpen: false,
  didInsertElement() {
    this._super(...arguments);
    if (!this.isOpen) {
      this.$('div').hide();
    }
  },
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('div').toggle('hidden');
    }
  }
});
