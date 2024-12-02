import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service(),
  store: service(),
  moreToShow: true,
  // eslint-disable-next-line ember/require-computed-property-dependencies
  modelPipelines: computed('model.pipelines', {
    get() {
      const currentModelPipelines = this.get('model.pipelines').toArray();
      const currentPipelinesShown = this.pipelinesToShow;

      if (
        Array.isArray(currentPipelinesShown) &&
        currentPipelinesShown.length
      ) {
        this.set('pipelinesToShow', []);
      }

      return [].concat(currentModelPipelines);
    }
  }),
  pipelines: computed('modelPipelines', 'pipelinesToShow', {
    get() {
      return [].concat(this.modelPipelines, this.pipelinesToShow);
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
        count: ENV.APP.NUM_PIPELINES_LISTED,
        sortBy: 'name',
        sort: 'ascending'
      };

      if (search) {
        pipelineListConfig.search = search.replace(/\s/g, '');
        this.setProperties({ query: search });
      }

      return this.store
        .query('pipeline', pipelineListConfig)
        .then(pipelines => {
          const nextPipelines = pipelines.toArray();

          if (!Array.isArray(nextPipelines) || nextPipelines.length === 0) {
            this.set('moreToShow', false);
          } else {
            this.set(
              'pipelinesToShow',
              this.pipelinesToShow.concat(nextPipelines)
            );
          }
        });
    },
    /**
     * Adding a pipeline to a collection
     * @param {Number} pipelineId - id of pipeline to add to collection
     * @param {Object} collection - collection object
     */
    addToCollection(pipelineId, collectionId) {
      return this.store
        .findRecord('collection', collectionId)
        .then(collection => {
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
