import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import { action, computed } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class CollectionsFlyout extends Component {
  @service
  session;

  @service
  store;

  collectionToDelete = null;

  showConfirmation = false;

  showModal = false;

  @computed('session.{data.authenticated.isGuest,isAuthenticated}', 'store')
  get collections() {
    if (
      !this.session.isAuthenticated ||
      this.session.data.authenticated.isGuest
    ) {
      return [];
    }
    const collections = this.store.peekAll('collection');

    if (collections.isLoaded) {
      return collections;
    }

    return this.store.findAll('collection');
  }

  @computed('collections.[]')
  get orderedCollections() {
    let defaultCollection;
    const normalCollections = this.collections.filter(collection => {
      if (collection.type === 'default') {
        defaultCollection = collection;
      }

      return collection.type !== 'default';
    });

    return defaultCollection
      ? [defaultCollection, ...normalCollections]
      : normalCollections;
  }

  @action
  openModal() {
    this.set('showModal', true);
  }

  /**
   * Action to cancel the deletion of a collection
   */
  @action
  cancelDeletingCollection() {
    this.set('collectionToDelete', null);
  }

  /**
   * Action to delete a collection
   * @param {collection} collection - the collection to delete
   */
  @action
  deleteCollection(collection) {
    const c = this.store.peekRecord('collection', collection.id);

    if (collection.id === localStorage.getItem('lastViewedCollectionId')) {
      localStorage.removeItem('lastViewedCollectionId');
    }

    return c.destroyRecord().then(() => {
      this.set('collectionToDelete', null);
      c.unloadRecord();
      c.transitionTo('deleted.saved');

      if (typeof this.onDeleteCollection === 'function') {
        this.onDeleteCollection();
      }
    });
  }

  /**
   * Action to set a collection to be deleted
   * @param {collection} collection - the collection to set for deletion
   */
  @action
  setCollectionToDelete(collection) {
    this.set('collectionToDelete', collection);
  }
}
