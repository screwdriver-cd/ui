import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { jwtDecode } from 'jwt-decode';

export default Component.extend({
  router: service(),
  session: service(),
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  slackUrl: ENV.APP.SLACK_URL,
  releaseVersion: ENV.APP.RELEASE_VERSION,
  searchTerm: '',
  isAdmin: computed('session.data.authenticated.token', function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (jwtDecode(token).scope || []).includes('admin');
  }),
  isNewUI: computed('router.{currentRouteName,currentURL}', {
    get() {
      const currentURL = get(this, 'router.currentURL');
      const isNewUIRoute = currentURL.includes('/v2/');

      return isNewUIRoute;
    }
  }),
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
    },
    switchUI() {
      const currentURL = get(this, 'router.currentURL');

      let targetURL = `/v2${currentURL}`;

      if (this.isNewUI) {
        targetURL = currentURL.split('/v2/').join('/');
      }

      this.router.transitionTo(targetURL);
    }
  }
});
