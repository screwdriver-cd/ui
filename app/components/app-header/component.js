import Component from '@ember/component';

export default Component.extend({
  tagName: 'header',
  showSearch: false,

  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    triggerSearch() {
      this.get('searchPipelines')(this.$('.search-input').val());
    },
    authenticate(scmContext) {
      this.get('authenticate')(scmContext);
    },
    clearMessage() {
      this.set('message', null);
    }
  }
});

