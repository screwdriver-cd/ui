import Ember from 'ember';
import DS from 'ember-data';

const formatCollection = (collection, currentCollectionId) => ({
  id: collection.get('id'),
  name: collection.get('name'),
  current: collection.id === currentCollectionId
});

export default Ember.Component.extend({
  collections: Ember.computed('storeCollections.[]', 'selectedCollectionId', function () {
    let currentCollectionId = this.get('selectedCollectionId');

    return DS.PromiseArray.create({
      promise: this.get('storeCollections').then(collections =>
        collections.map(collection => formatCollection(collection, currentCollectionId)))
    });
  }),
  storeCollections: Ember.computed('store', function () {
    return this.get('store').findAll('collection');
  }),
  errorMessage: null,
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
    }
  }
});
