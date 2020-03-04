import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import { isPRJob } from 'screwdriver-ui/utils/build';

import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  pipeline: alias('model.pipeline'),
  jobIds: computed(function() {
    return this.pipeline.jobs.filter(j => !isPRJob(j.get('name'))).map(job => job.id);
  }),
  jobs: computed('pipeline', {
    get() {
      return this.pipeline.jobs.filter(j => !isPRJob(j.get('name')));
    }
  }),
  collections: alias('model.collections'),
  actions: {
    addToCollection(pipelineId, collection) {
      const { pipelineIds } = collection;

      if (!pipelineIds.includes(pipelineId)) {
        collection.set('pipelineIds', [...pipelineIds, pipelineId]);
      }

      return collection.save();
    }
  }
});
