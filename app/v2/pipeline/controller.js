import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
// import { tracked } from '@glimmer/tracking';

export default class NewPipelineController extends Controller {
  @service session;

  get collections() {
    return this.model.collections;
  }

  get pipeline() {
    return this.model.pipeline;
  }

  @action
  addToCollection(pipelineId, collection) {
    const { pipelineIds } = collection;

    if (!pipelineIds.includes(pipelineId)) {
      collection.set('pipelineIds', [...pipelineIds, pipelineId]);
    }

    return collection.save();
  }
}
