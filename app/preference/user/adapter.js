import Adapter from 'ember-local-storage/adapters/local';
import { inject as service } from '@ember/service';

export default class PreferenceUserAdapter extends Adapter {
  modelNamespace = 'preference';

  @service shuttle;

  async queryRecord(/* store, type, query */) {
    return this.shuttle.getUserSetting();
  }

  async updateRecord(store, type, snapshot) {
    const serializer = store.serializerFor(type.modelName);
    const data = serializer.serializeIntoHash({}, type, snapshot, {
      includeId: true
    });

    return this.shuttle.updateUserSetting(data);
  }

  async deleteRecord(/* store, type, query */) {
    return this.shuttle.deleteUserSettings();
  }
}
