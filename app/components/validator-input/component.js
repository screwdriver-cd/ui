import Component from '@ember/component';

export default Component.extend({
  isOpen: true,
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.element
        .querySelectorAll('#validator-ace-editor')
        .forEach(el => el.classList.toggle('hidden'));
    }
  }
});
