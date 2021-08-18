import Component from '@ember/component';

export default Component.extend({
  isOpen: false,
  didInsertElement() {
    this._super(...arguments);
    if (!this.isOpen) {
      this.element
        .querySelectorAll('div')
        .forEach((el) => el.classList.add('hidden'));
    }
  },
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.element
        .querySelectorAll('div')
        .forEach((el) => el.classList.toggle('hidden'));
    }
  }
});
