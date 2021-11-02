import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

import Controller from '@ember/controller';

@classic
export default class PipelineController extends Controller {
  @service('session')
  session;

  @alias('model.pipeline')
  pipeline;

  @alias('model.collections')
  collections;

  @action
  addToCollection(pipelineId, collection) {
    const { pipelineIds } = collection;

    if (!pipelineIds.includes(pipelineId)) {
      collection.set('pipelineIds', [...pipelineIds, pipelineId]);
    }

    return collection.save();
  }
}
