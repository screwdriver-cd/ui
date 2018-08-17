import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  store: service(),
  collectionToDelete: null,
  showConfirmation: false,
  showDeleteButtons: false,
  showModal: false,
  collections: computed('store', {
    get() {
      if (!get(this, 'session.isAuthenticated') ||
        get(this, 'session.data.authenticated.isGuest')) {
        return [];
      }

      return this.get('store').findAll('collection');
    }
  }),

  actions: {
    changeCollectionDisplayed() {
      let changeCollection = this.get('changeCollection');

      changeCollection();
    },
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
      const c = this.get('store')
        .peekRecord('collection', collection.id);

      return c.destroyRecord()
        .then(() => {
          this.set('collectionToDelete', null);

          if (typeof this.get('onDeleteCollection') === 'function') {
            this.get('onDeleteCollection')();
          }
        });
    },
    /**
     * Action to set a collection to be deleted
     * @param {collection} collection - the collection to set for deletion
     */
    setCollectionToDelete(collection) {
      this.set('collectionToDelete', collection);
    },
    /**
     * Action to open / close the create collection modal
     * @param {boolean} open - whether modal should be open
     */
    toggleEdit() {
      this.set('showDeleteButtons', !this.get('showDeleteButtons'));
    }
  }
});
