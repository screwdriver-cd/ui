import { set } from '@ember/object';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  router: service(),
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
      this.router.transitionTo('home');
    },
    addMultipleToCollection(addedPipelineIds, collectionId) {
      return this.shuttle.updateCollection(collectionId, addedPipelineIds);
    }
  }
});
