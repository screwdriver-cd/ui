import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { is404 } from '../../utils/not-found-error';

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
    error(error) {
      localStorage.removeItem('lastViewedCollectionId');

      return is404(error);
    }
  }
});
