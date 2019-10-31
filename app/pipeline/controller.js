import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  pipeline: alias('model.pipeline'),
  collections: alias('model.collections'),
  actions: {
    addToCollection(pipelineId, collection) {
      collection.pipelineIds.push(pipelineId);

      return collection.save();
    }
  }
});
