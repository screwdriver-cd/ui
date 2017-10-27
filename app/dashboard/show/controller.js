import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model'),
  actions: {
    removePipeline(pipelineId, collectionId) {
      return this.store.findRecord('collection', collectionId)
        .then((collection) => {
          const pipelineIds = collection.get('pipelineIds') || [];

          collection.set('pipelineIds', pipelineIds.filter(id => id !== pipelineId));

          return collection.save();
        });
    },
    onDeleteCollection() {
      this.transitionToRoute('/');
    }
  }
});
