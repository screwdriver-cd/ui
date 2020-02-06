import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  store: service(),
  collectionToDelete: null,
  showConfirmation: false,
  showModal: false,
  collections: computed('store', {
    get() {
      if (
        !get(this, 'session.isAuthenticated') ||
        get(this, 'session.data.authenticated.isGuest')
      ) {
        return [];
      }
      const collections = this.store.peekAll('collection');

      if (collections.isLoaded) {
        return collections;
      }

      return this.store.findAll('collection');
    }
  }),
  orderedCollections: computed('collections.[]', {
    get() {
      let defaultCollection;
      const normalCollections = this.collections.filter(collection => {
        if (collection.type === 'default') {
          defaultCollection = collection;
        }

        return collection.type !== 'default';
      });

      return defaultCollection ? [defaultCollection, ...normalCollections] : normalCollections;
    }
  }),

  actions: {
    openModal() {
      this.set('showModal', true);
    },
    /**
     * Action to cancel the deletion of a collection
     */
    cancelDeletingCollection() {
      this.set('collectionToDelete', null);
    },
    /**
     * Action to delete a collection
     * @param {collection} collection - the collection to delete
     */
    deleteCollection(collection) {
      const c = this.store.peekRecord('collection', collection.id);

      return c.destroyRecord().then(() => {
        this.set('collectionToDelete', null);
        c.unloadRecord();
        c.transitionTo('deleted.saved');

        if (typeof this.onDeleteCollection === 'function') {
          this.onDeleteCollection();
        }
      });
    },
    /**
     * Action to set a collection to be deleted
     * @param {collection} collection - the collection to set for deletion
     */
    setCollectionToDelete(collection) {
      this.set('collectionToDelete', collection);
    }
  }
});
