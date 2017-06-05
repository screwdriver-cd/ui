import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'header',
  showSearch: false,

  /**
   * Show/hide menu when window is small
   * @method toggleMenu
   */
  toggleMenu() {
    this.$().toggleClass('open');
    this.$('#toggle').toggleClass('x');
  },

  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    onToggleClick() {
      this.toggleMenu();
    },
    triggerSearch() {
      this.get('searchPipelines')(this.$('.search-input').val());
    }
  }
});
