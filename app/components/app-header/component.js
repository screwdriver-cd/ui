import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  actions: {
    invalidateSession() {
      this.onInvalidate();
    },
    triggerSearch() {
      this.searchPipelines(this.$('.search-input').val());
    },
    authenticate(scmContext) {
      this.authenticate(scmContext);
    }
  }
});
