import Component from '@ember/component';

export default Component.extend({
  isOpen: false,
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('#validator-ace-editor').toggle('hidden');
    }
  }
});
