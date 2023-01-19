import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model.collection'),
  shuttle: service(),
  actions: {
    removePipeline(pipelineId, collectionId) {
      return this.shuttle.removePipeline(collectionId, pipelineId);
    },
    removeMultiplePipelines(removedPipelineIds, collectionId) {
      return this.shuttle.removeMultiplePipelines(
        collectionId,
        removedPipelineIds
      );
    },
    onDeleteCollection() {
      this.transitionToRoute('home');
    },
    addMultipleToCollection(addedPipelineIds, collectionId) {
      return this.shuttle.updateCollection(collectionId, addedPipelineIds);
    }
  }
});
