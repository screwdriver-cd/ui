import Route from '@ember/routing/route';
import { get } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model() {
    if (get(this, 'session.isAuthenticated')) {
      // No reason to go fetch collections for a guest user
      if (get(this, 'session.data.authenticated.isGuest')) {
        return;
      }

      this.store
        .findAll('collection')
        .then(collections => {
          if (get(collections, 'length')) {
            // Get the id of the default collection.
            const defaultCollection = collections.find(collection => collection.type === 'default');
            const routeId = defaultCollection.id;

            let lastViewedCollectionId = localStorage.getItem('lastViewedCollectionId');

            if (lastViewedCollectionId) {
              this.replaceWith(`/dashboards/${lastViewedCollectionId}`);
            } else {
              this.replaceWith(`/dashboards/${routeId}`);
            }
          }
        })
        .catch(() => {
          // do nothing
        });
    }
  }
});
