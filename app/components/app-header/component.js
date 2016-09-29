import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'header',
  showSearch: false,

  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    onFocus() {
      this.$('.search').addClass('search-focused');
    },
    onBlur() {
      this.$('.search').removeClass('search-focused');
    }
  }
});
