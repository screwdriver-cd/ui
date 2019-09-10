import Component from '@ember/component';

export default Component.extend({
  classNames: ['collection-dropdown'],
  showCollectionModal: false,
  addCollectionError: null,
  addCollectionSuccess: null,
  pipeline: null,
  buttonText: undefined,
  buttonClass: undefined,
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(collection) {
      if (this.get('pipeline') && this.addToCollection) {
        return this.addToCollection(+this.get('pipeline').id, collection)
          .then(() => {
            this.set('addCollectionError', null);
            this.set('addCollectionSuccess', `Successfully added Pipeline to ${collection.name}`);
          })
          .catch(() => {
            this.set('addCollectionError', `Could not add Pipeline to ${collection.name}`);
            this.set('addCollectionSuccess', null);
          });
      }

      return this.addMultipleToCollection(collection)
        .then(() => {
          this.set('addCollectionError', null);
          this.set(
            'addCollectionSuccess',
            `Successfully added all Pipelines to ${collection.name}`
          );
        })
        .catch(() => {
          this.set('addCollectionError', `Could not add all Pipelines to ${collection.name}`);
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
