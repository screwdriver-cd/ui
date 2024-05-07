import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Component.extend({
  router: service(),
  session: service(),
  tagName: 'header',
  showSearch: false,
  docUrl: ENV.APP.SDDOC_URL,
  slackUrl: ENV.APP.SLACK_URL,
  releaseVersion: ENV.APP.RELEASE_VERSION,
  searchTerm: '',
  isAdmin: computed(
    'session.data.authenticated.scope',
    function isAdminFunction() {
      const isAdmin = (this.session.data.authenticated.scope || []).includes(
        'admin'
      );

      return isAdmin;
    }
  ),
  isNewUI: computed('router.{currentRouteName,currentURL}', {
    get() {
      const currentURL = get(this, 'router.currentURL');
      const isNewUIRoute = currentURL.includes('/v2/');

      return isNewUIRoute;
    }
  }),
  hasAlternativeRoute: computed(
    'isNewUI',
    'router.{currentRouteName,currentURL}',
    {
      get() {
        const routeName = this.router.currentRouteName;

        let alterRouteName = `v2.${this.router.currentRouteName}`;

        if (this.isNewUI) {
          // to remove v2. prefix
          alterRouteName = routeName.slice(3);
        }

        const alterRoute = getOwner(this).lookup(`route:${alterRouteName}`);

        return alterRoute;
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

      let targetURL = `/v2${currentURL}`;

      if (this.isNewUI) {
        targetURL = currentURL.split('/v2/').join('/');
      }

      this.router.transitionTo(targetURL);
    }
  }
});
