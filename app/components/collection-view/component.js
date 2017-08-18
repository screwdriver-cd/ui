import Ember from 'ember';

export default Ember.Component.extend({
  session: Ember.inject.service(),
  removePipelineError: null,
  actions: {
    /**
     * Action to remove a pipeline from a collection
     *
     * @param {Number} pipelineId - id of pipeline to remove
     * @param {Number} collectionId - id of collection to remove from
     * @returns {Promise}
     */
    pipelineRemove(pipelineId, collectionId) {
      return this.get('onPipelineRemove')(+pipelineId, collectionId)
        .then(() => {
          this.set('removePipelineError', null);
        })
        .catch((error) => {
          this.set('removePipelineError', error.errors[0].detail);
        });
    }
  }
});
