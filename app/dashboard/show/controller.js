import { alias } from '@ember/object/computed';
import { get, getWithDefault, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model'),
  actions: {
    removePipeline(pipelineId, collectionId) {
      return get(this, 'store').findRecord('collection', collectionId)
        .then((collection) => {
          const pipelineIds = getWithDefault(collection, 'pipelineIds', []);

          set(collection, 'pipelineIds', pipelineIds.filter(id => id !== pipelineId));

          return collection.save();
        });
    },
    onDeleteCollection() {
      this.transitionToRoute('home');
    }
  }
});
