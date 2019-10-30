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
        const pipelineId = +this.pipeline.id;
        const collectionId = +collection.id;

        return this.addToCollection(pipelineId, collectionId)
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
