// import JSONAPIAdapter from '@ember-data/adapter/json-api';

// export default class PreferenceUserAdapter extends JSONAPIAdapter {
// }

import Adapter from 'ember-local-storage/adapters/local';
import { inject as service } from '@ember/service';

export default class PreferenceUserAdapter extends Adapter {
  modelNamespace = 'preference';

  @service shuttle;

  async queryRecord(store, type, query) {
    console.log('111');

    const userSetting = await this.shuttle.getUserSetting();

    console.log('111', userSetting);

    return userSetting;
  }
}
