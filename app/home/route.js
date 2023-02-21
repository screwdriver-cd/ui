import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  model() {
    if (get(this, 'session.isAuthenticated')) {
      // No reason to go fetch collections for a guest user
      if (get(this, 'session.data.authenticated.isGuest')) {
        return;
      }

      this.store
        .findAll('collection')
        .then(collections => {
          if (collections.length) {
            // Get the id of the default collection.
            const defaultCollection = collections.find(
              collection => collection.type === 'default'
            );
            const routeId = defaultCollection.id;

            const lastViewedCollectionId = localStorage.getItem(
              'lastViewedCollectionId'
            );

            if (lastViewedCollectionId) {
              this.router.replaceWith(`/dashboards/${lastViewedCollectionId}`);
            } else {
              this.router.replaceWith(`/dashboards/${routeId}`);
            }
          }
        })
        .catch(() => {
          // do nothing
        });
    }
  }
});
