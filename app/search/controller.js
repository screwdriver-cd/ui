import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import ENV from 'screwdriver-ui/config/environment';
import Controller from '@ember/controller';

@classic
export default class SearchController extends Controller {
  @service
  session;

  moreToShow = true;

  @computed('model.pipelines', 'pipelinesToShow')
  get modelPipelines() {
    const currentModelPipelines = this.get('model.pipelines').toArray();
    const currentPipelinesShown = this.pipelinesToShow;

    if (Array.isArray(currentPipelinesShown) && currentPipelinesShown.length) {
      this.set('pipelinesToShow', []);
    }

    return [].concat(currentModelPipelines);
  }

  @computed('modelPipelines', 'pipelinesToShow')
  get pipelines() {
    return [].concat(this.modelPipelines, this.pipelinesToShow);
  }

  @reads('model.collections')
  collections;

  @reads('model.query')
  query;

  editingDescription = false;

  editingName = false;

  init() {
    super.init(...arguments);

    this.set('pipelinesToShow', []);
  }

  @action
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

    return this.store.query('pipeline', pipelineListConfig).then(pipelines => {
      const nextPipelines = pipelines.toArray();

      if (Array.isArray(nextPipelines)) {
        if (nextPipelines.length < ENV.APP.NUM_PIPELINES_LISTED) {
          this.set('moreToShow', false);
        }

        this.set('pipelinesToShow', this.pipelinesToShow.concat(nextPipelines));
      }
    });
  }

  /**
   * Adding a pipeline to a collection
   * @param {Number} pipelineId - id of pipeline to add to collection
   * @param {Object} collection - collection object
   */
  @action
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
  }

  @action
  changeCollection() {
    this.set('editingDescription', false);
    this.set('editingName', false);
  }
}
