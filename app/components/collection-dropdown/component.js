import Component from '@ember/component';

export default Component.extend({
  classNames: ['collection-dropdown'],
  showCollectionModal: false,
  addCollectionError: null,
  addCollectionSuccess: null,
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(pipelineId, collection) {
      return this.addToCollection(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set(
            'addCollectionSuccess',
            `Successfully added Pipeline to ${collection.get('name')}`
          );
        })
        .catch(() => {
          this.set('addCollectionError', `Could not add Pipeline to ${collection.get('name')}`);
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
