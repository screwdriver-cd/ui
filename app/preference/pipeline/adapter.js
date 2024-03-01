import Adapter from 'ember-local-storage/adapters/local';
import { inject as service } from '@ember/service';
import { preparePayload } from 'screwdriver-ui/preference/user/serializer';

export default class PreferencePipelineAdapter extends Adapter {
  modelNamespace = 'preference';

  @service shuttle;

  @service userSettings;

  async createRecord(store, type, snapshot) {
    const serializer = store.serializerFor(type.modelName);
    const { id, pipelinePreference } = serializer.serializeIntoHash(
      {},
      type,
      snapshot,
      { includeId: true }
    );
    const data = await this.createPayload();

    data[id] = pipelinePreference;

    return this.shuttle.updateUserSetting(data);
  }

  async updateRecord() {
    const data = await this.createPayload();

    return this.shuttle.updateUserSetting(data);
  }

  async createPayload() {
    const userPreferences = await this.userSettings.getUserPreference();

    return preparePayload(userPreferences.serialize());
  }
}
