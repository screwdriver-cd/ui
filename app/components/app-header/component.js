import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Component.extend({
  tagName: 'header',
  uiHostname: ENV.APP.SDUI_HOSTNAME,

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
