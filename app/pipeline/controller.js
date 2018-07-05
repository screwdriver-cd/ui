import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  pipeline: alias('model.pipeline'),
  collections: alias('model.collections'),
  actions: {
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
