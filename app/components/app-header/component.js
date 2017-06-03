import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'header',
  showSearch: false,

  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    triggerSearch() {
      this.get('searchPipelines')(this.$('.search-input').val());
    }
  }
});
