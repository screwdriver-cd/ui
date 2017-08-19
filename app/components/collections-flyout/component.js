import Ember from 'ember';
import DS from 'ember-data';

const formatCollection = (collection, currentCollectionId) => ({
  id: collection.get('id'),
  name: collection.get('name'),
  current: collection.id === currentCollectionId
});

export default Ember.Component.extend({
  collections: Ember.computed('storeCollections.[]', 'selectedCollectionId', {
    get() {
      let currentCollectionId = this.get('selectedCollectionId');

      return DS.PromiseArray.create({
        promise: this.get('storeCollections').then(collections =>
          collections.map(collection => formatCollection(collection, currentCollectionId)))
      });
    }
  }),
  storeCollections: Ember.computed('store', {
    get() {
      return this.get('store').findAll('collection');
    }
  }),
  collectionToDelete: null,
  errorMessage: null,
  showConfirmation: false,
  showDeleteButtons: false,
  showModal: false,
  session: Ember.inject.service(),
  store: Ember.inject.service(),
  actions: {
    /**
     * Action to create a new collection
     */
    addNewCollection() {
      const name = this.get('name');
      const description = this.get('description');

      Ember.run.schedule('actions', () => {
        const newCollection = this.get('store').createRecord('collection', {
          name,
          description
        });

        return newCollection.save()
          .then(() => {
            this.set('showModal', false);
          })
          .catch((error) => {
            newCollection.destroyRecord();
            this.set('errorMessage', error.errors[0].detail);
          });
      });
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
    setModal(open) {
      if (!open) {
        this.set('name', null);
        this.set('description', null);
        this.set('errorMessage', null);
      }
      this.set('showModal', open);
    },
    toggleEdit() {
      this.set('showDeleteButtons', !this.get('showDeleteButtons'));
    }
  }
});
