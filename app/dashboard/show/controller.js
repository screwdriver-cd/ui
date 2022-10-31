import { set } from '@ember/object';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  router: service(),
  collection: alias('model.collection'),
  actions: {
    removePipeline(pipelineId) {
      const collectionId = this.get('collection.id');

      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
          const pipelineIds =
            collection.pipelineIds === undefined ? [] : collection.pipelineIds;

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
          const pipelineIds =
            collection.pipelineIds === undefined ? [] : collection.pipelineIds;

          set(
            collection,
            'pipelineIds',
            pipelineIds.filter(id => !removedPipelineIds.includes(id))
          );

          return collection.save();
        });
    },
    onDeleteCollection() {
      this.router.transitionTo('home');
    },
    addMultipleToCollection(addedPipelineIds, collectionId) {
      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
          const pipelineIds = collection.get('pipelineIds');

          collection.set('pipelineIds', [
            ...new Set([...pipelineIds, ...addedPipelineIds])
          ]);

          return collection.save();
        });
    }
  }
});
