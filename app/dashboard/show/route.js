import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  model(params) {
    const collections =
      this.controllerFor('application').get('collections') === undefined
        ? []
        : this.controllerFor('application').get('collections');

    return this.store
      .findRecord('collection', params.collection_id, { reload: true })
      .then(collection =>
        RSVP.hash({
          collection,
          collections
        })
      );
  },

  actions: {
    error(/* error, transition */) {
      localStorage.removeItem('lastViewedCollectionId');

      return this.router.transitionTo('/404');
    }
  }
});
