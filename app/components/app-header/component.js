import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Component.extend({
  tagName: 'header',
  showSearch: false,
  showAlphaWarning: ENV.APP.FEAT_DISPLAY_ALPHA,
  actions: {
    invalidateSession() {
      this.get('onInvalidate')();
    },
    triggerSearch() {
      this.get('searchPipelines')(this.$('.search-input').val());
    }
  }
});
