import Component from '@ember/component';
import { filter } from '@ember/object/computed';

export default Component.extend({
  classNames: ['collection-dropdown'],
  showCollectionModal: false,
  addCollectionError: null,
  addCollectionSuccess: null,
  pipeline: null,
  buttonText: undefined,
  buttonClass: undefined,
  normalCollections: filter(
    'collections.[]',
    collection => collection.type !== 'default'
  ),
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(collection) {
      if (this.pipeline && this.addToCollection) {
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
