import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service(),
  actions: {
    /**
     * Adding a pipeline to a collection
     * @param {Number} pipelineId - id of pipeline to add to collection
     * @param {Object} collection - collection object
     */
    addToCollection(pipelineId, collectionId) {
      return this.store.findRecord('collection', collectionId)
        .then((collection) => {
          const pipelineIds = collection.get('pipelineIds');

          if (!pipelineIds.includes(pipelineId)) {
            collection.set('pipelineIds', [...pipelineIds, pipelineId]);
          }

          return collection.save();
        });
    }
  }
});
