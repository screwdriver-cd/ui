import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  slackUrl: ENV.APP.SLACK_URL,
  releaseVersion: ENV.APP.RELEASE_VERSION,
  searchTerm: '',
  actions: {
    invalidateSession() {
      this.onInvalidate();
    },
    triggerSearch() {
      this.searchPipelines(this.searchTerm);
    },
    authenticate(scmContext) {
      this.authenticate(scmContext);
    },
    cancelSearch() {
      this.set('showSearch', false);
    },
    openCreatePipeline() {
      this.set('showCreatePipeline', true);
    },
    openSearchForm() {
      this.set('showSearch', true);
    }
  }
});
