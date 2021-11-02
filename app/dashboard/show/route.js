import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

@classic
export default class ShowRoute extends Route.extend(AuthenticatedRouteMixin) {
  model(params) {
    const { collections } = this.modelFor('application');

    return this.store
      .findRecord('collection', params.collection_id, { reload: true })
      .then(collection =>
        RSVP.hash({
          collection,
          collections
        })
      );
  }

  @action
  error() {
    localStorage.removeItem('lastViewedCollectionId');

    return this.transitionTo('/404');
  }
}
