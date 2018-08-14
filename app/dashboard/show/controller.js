import { alias } from '@ember/object/computed';
import { get, getWithDefault, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  collection: alias('model'),
  editingDescription: false,
  editingName: false,
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
    },
    changeCollection(collection) {
      this.set('editingDescription', false);
      this.set('editingName', false);
      this.transitionToRoute('dashboard.show', collection);
    }
  }
});
