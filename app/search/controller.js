import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service(),
  pipelines: reads('model.pipelines'),
  collections: reads('model.collections'),
  query: reads('model.query'),
  editingDescription: false,
  editingName: false,
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
    },
    changeCollection() {
      this.set('editingDescription', false);
      this.set('editingName', false);
    }
  }
});
