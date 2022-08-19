import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import { debounce } from '@ember/runloop';

export default Component.extend({
  shuttle: service(),
  selectedTimestampFormat: {},
  timestampOptions: [
    { key: 'UTC', name: 'UTC' },
    { key: 'LOCAL_TIMEZONE', name: 'Local Timezone' }
  ],
  async init() {
    this._super(...arguments);

    let selectedTimestampFormat = this.timestampOptions.find(
      timestamp => timestamp.key === 'LOCAL_TIMEZONE'
    );
    const userSetting = await this.shuttle.getUserSetting();

    if (userSetting) {
      selectedTimestampFormat = this.timestampOptions.find(
        timestamp => timestamp.key === userSetting.timestampFormat
      );
    }
    this.setProperties({
      selectedTimestampFormat
    });
  },
  async updateTimestampFormat(timestampFormat) {
    const userSetting = await this.shuttle.getUserSetting();

    set(userSetting, 'timestampFormat', timestampFormat.key);
    await this.shuttle.updateUserSettings(userSetting);
    this.set('selectedTimestampFormat', timestampFormat);
  },

  actions: {
    async selectTimestampFormat(selectedTimestampFormat) {
      let timestampFormat = selectedTimestampFormat;

      debounce(this, this.updateTimestampFormat, timestampFormat, 1000);
    }
  }
});
