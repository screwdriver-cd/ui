import Component from '@ember/component';

export default Component.extend({
  isOpen: true,
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('div').toggle('hidden');
    }
  }
});
