import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { getWithDefault, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model.collection'),
  shuttle: service(),
  actions: {
    removePipeline(pipelineId) {
      const collectionId = this.get('collection.id');

      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
          const pipelineIds = getWithDefault(collection, 'pipelineIds', []);

          set(
            collection,
            'pipelineIds',
            pipelineIds.filter(id => id !== pipelineId)
          );

          return collection.save();
        });
    },
    removeMultiplePipelines(removedPipelineIds) {
      const collectionId = this.get('collection.id');

      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
          const pipelineIds = getWithDefault(collection, 'pipelineIds', []);

          set(
            collection,
            'pipelineIds',
            pipelineIds.filter(id => !removedPipelineIds.includes(id))
          );

          return collection.save();
        });
    },
    onDeleteCollection() {
      this.transitionToRoute('home');
    },
    addMultipleToCollection(addedPipelineIds, collectionId) {
      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
          const pipelineIds = collection.get('pipelineIds');

          this.shuttle.updateCollection(collectionId, addedPipelineIds);
        });
    }
  }
});
