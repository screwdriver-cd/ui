import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service(),
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
