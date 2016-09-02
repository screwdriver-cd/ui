import Ember from 'ember';

export default Ember.Component.extend({
  isOpen: false,
  /**
   * Automatically set isOpen when component is initialized
   * @method init
   */
  init() {
    this._super(...arguments);

    // if code is defined and not 0
    if (this.get('step.code')) {
      this.isOpen = true;
    }
  },

  actions: {
    toggleOpen() {
      this.set('isOpen', !this.get('isOpen'));
    }
  }
});
