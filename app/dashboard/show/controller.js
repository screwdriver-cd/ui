import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { getWithDefault, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model.collection'),
  shuttle: service(),
  actions: {
    async removePipeline(pipelineId) {
      const collectionId = this.get('collection.id');
      try {
        await this.shuttle.removePipeline(collectionId, pipelineId);
        const collection = await this.store.findRecord('collection', collectionId);

        return collection.save();
      }
      catch (e) {
        return e;
      }
    },
    async removeMultiplePipelines(removedPipelineIds) {
      const collectionId = this.get('collection.id');

      try {
        await this.shuttle.removeMultiplePipelines(collectionId, removedPipelineIds);
        const collection = await this.store.findRecord('collection', collectionId);

        return collection.save();
      }
      catch (e) {
        return e;
      }
    },
    onDeleteCollection() {
      this.transitionToRoute('home');
    },
    async addMultipleToCollection(addedPipelineIds, collectionId) {
      try {
        await this.shuttle.updateCollection(collectionId, addedPipelineIds);
        const collection = await this.store.findRecord('collection', collectionId);

        return collection.save();
      }
      catch (e) {
        return e;
      }
    }
  }
});
