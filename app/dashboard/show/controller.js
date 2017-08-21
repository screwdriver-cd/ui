import Ember from 'ember';

export default Ember.Controller.extend({
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
