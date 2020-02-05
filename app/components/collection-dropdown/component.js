import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['collection-dropdown'],
  showCollectionModal: false,
  collections: null,
  addCollectionError: null,
  addCollectionSuccess: null,
  pipeline: null,
  buttonText: undefined,
  buttonClass: undefined,
  filteredCollections: computed('collections', {
    get() {
      const { collections } = this;

      return collections.filter(collection => collection.type !== 'default');
    }
  }),
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(collection) {
      if (this.get('pipeline') && this.addToCollection) {
        return this.addToCollection(+this.pipeline.id, collection)
          .then(() => {
            this.setProperties({
              addCollectionError: null,
              addCollectionSuccess: `Successfully added Pipeline to ${collection.name}`
            });
          })
          .catch(() => {
            this.setProperties({
              addCollectionError: `Could not add Pipeline to ${collection.name}`,
              addCollectionSuccess: null
            });
          });
      }

      return this.addMultipleToCollection(collection)
        .then(() => {
          this.setProperties({
            addCollectionError: null,
            addCollectionSuccess: `Successfully added all Pipelines to ${collection.name}`
          });
        })
        .catch(() => {
          this.setProperties({
            addCollectionError: `Could not add all Pipelines to ${collection.name}`,
            addCollectionSuccess: null
          });
        });
    }
  }
});
