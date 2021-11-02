import classic from 'ember-classic-decorator';
import { alias } from '@ember/object/computed';
import { action } from '@ember/object';
import Controller from '@ember/controller';

@classic
export default class ShowController extends Controller {
  @alias('model.collection')
  collection;

  @action
  async removePipeline(pipelineId) {
    return this.removeMultiplePipelines([pipelineId]);
  }

  @action
  async removeMultiplePipelines(removedPipelineIds) {
    const { collection } = this;
    const pipelineIds =
      collection.pipelineIds === undefined ? [] : collection.pipelineIds;

    collection.pipelineIds = pipelineIds.filter(
      id => !removedPipelineIds.includes(id)
    );

    await collection.save();

    return this.store.findRecord('collection', this.collection.id);
  }

  @action
  onDeleteCollection() {
    this.transitionToRoute('home');
  }

  @action
  addMultipleToCollection(addedPipelineIds, collectionId) {
    return this.store
      .findRecord('collection', collectionId)
      .then(collection => {
        const pipelineIds = collection.get('pipelineIds');

        collection.set('pipelineIds', [
          ...new Set([...pipelineIds, ...addedPipelineIds])
        ]);

        return collection.save();
      });
  }
}
