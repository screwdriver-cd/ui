import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    const collections = this.controllerFor('application').getWithDefault(
      'collections',
      []
    );

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
    error() {
      localStorage.removeItem('lastViewedCollectionId');

      return this.transitionTo('/404');
    }
  }
});
