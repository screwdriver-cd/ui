import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),
  session: service(),
  optInRouteMapping: service(),
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  slackUrl: ENV.APP.SLACK_URL,
  releaseVersion: ENV.APP.RELEASE_VERSION,
  searchTerm: '',
  isNewUI: computed('router.currentURL', {
    get() {
      const currentURL = get(this, 'router.currentURL');

      return currentURL.startsWith('/v2');
    }
  }),
  hasAlternativeRoute: computed(
    'router.currentRouteName',
    'optInRouteMapping.routeMappings',
    {
      get() {
        const routeName = this.router.currentRouteName;

        return this.optInRouteMapping.routeMappings.has(routeName);
      }
    }
  ),
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

      let targetURL = currentURL;

      if (this.isNewUI) {
        targetURL = currentURL.replace('/v2/', '/');

        if (targetURL.includes('pulls')) {
          targetURL = `${targetURL.split('pulls/')[0]}pulls`;
        }
      } else {
        targetURL = `/v2${currentURL}`;
      }

      this.router.transitionTo(targetURL);
    }
  }
});
