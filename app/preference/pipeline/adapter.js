import Adapter from 'ember-local-storage/adapters/local';
import { inject as service } from '@ember/service';

export default class PreferencePipelineAdapter extends Adapter {
  modelNamespace = 'preference';

  @service shuttle;

  async createRecord(store, type, snapshot) {
    const serializer = store.serializerFor(type.modelName);
    const { id, pipelinePreference } = serializer.serializeIntoHash(
      {},
      type,
      snapshot,
      { includeId: true }
    );

    return this.shuttle.updateUserPreference(id, pipelinePreference);
  }

  async updateRecord(store, type, snapshot) {
    const serializer = store.serializerFor(type.modelName);
    const { id, pipelinePreference } = serializer.serializeIntoHash(
      {},
      type,
      snapshot,
      { includeId: true }
    );

    return this.shuttle.updateUserPreference(id, pipelinePreference);
  }
}
