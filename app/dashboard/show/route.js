import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  router: service(),
  model(params) {
    return this.store
      .findRecord('collection', params.collection_id, { reload: true })
      .then(collection =>
        RSVP.hash({
          collection
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
