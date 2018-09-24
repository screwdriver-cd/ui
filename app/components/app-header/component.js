import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    triggerSearch() {
      this.get('searchPipelines')(this.$('.search-input').val());
    },
    authenticate(scmContext) {
      this.get('authenticate')(scmContext);
    }
  }
});
