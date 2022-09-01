import Adapter from 'ember-local-storage/adapters/local';
import { inject as service } from '@ember/service';

export default class PreferenceUserAdapter extends Adapter {
  modelNamespace = 'preference';

  @service shuttle;

  async queryRecord(store, type, query) {
    const userSetting = await this.shuttle.getUserSetting();

    return userSetting;
  }

  async updateRecord(store, type, snapshot) {
    console.log('erherereerer updateRecord');

    const serializer = store.serializerFor(type.modelName);
    const data = serializer.serializeIntoHash({}, type, snapshot, { includeId: true });

    console.log('data', data);

    return this.shuttle.updateUserSetting(data);

    // this.shuttle.updateUserSetting(data);

    // const userSetting =
    // this.shuttle.updateUserPreference(null, {
    //   displayJobNameLength: desiredJobNameLength
    // });
    // return userSetting;

    // return this.shuttle.updateUserPreference(null, {
    //   displayJobNameLength: desiredJobNameLength
    // });
  }
}
