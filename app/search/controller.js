import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service(),
  moreToShow: true,
  modelPipelines: computed('model.pipelines', {
    get() {
      const currentModelPipelines = this.get('model.pipelines').toArray();
      const currentPipelinesShown = this.get('pipelinesToShow');

      if (Array.isArray(currentPipelinesShown) && currentPipelinesShown.length) {
        this.set('pipelinesToShow', []);
      }

      return [].concat(currentModelPipelines);
    }
  }),
  pipelines: computed('modelPipelines', 'pipelinesToShow', {
    get() {
      return [].concat(this.get('modelPipelines'), this.get('pipelinesToShow'));
    }
  }),
  collections: reads('model.collections'),
  query: reads('model.query'),
  editingDescription: false,
  editingName: false,
  init() {
    this._super(...arguments);

    this.set('pipelinesToShow', []);
  },
  actions: {
    updatePipelines({ page, search }) {
      const pipelineListConfig = {
        page,
        count: ENV.APP.NUM_PIPELINES_LISTED
      };

      if (search) {
        pipelineListConfig.search = search;
        this.setProperties({ query: search });
      }

      return get(this, 'store').query('pipeline', pipelineListConfig)
        .then((pipelines) => {
          const nextPipelines = pipelines.toArray();

          if (Array.isArray(nextPipelines)) {
            if (nextPipelines.length < ENV.APP.NUM_PIPELINES_LISTED) {
              this.set('moreToShow', false);
            }

            this.set('pipelinesToShow',
              this.get('pipelinesToShow').concat(nextPipelines));
          }
        });
    },
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
