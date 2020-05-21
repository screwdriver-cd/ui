import Component from '@ember/component';

export default Component.extend({
  isOpen: false,

  actions: {
    closeMenu() {
      this.set('isOpen', false);
    },

    openMenu() {
      this.set('isOpen', true);
    }
  }
});
