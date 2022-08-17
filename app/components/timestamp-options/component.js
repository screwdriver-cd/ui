import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import { debounce } from '@ember/runloop';

export default Component.extend({
  shuttle: service(),
  selectedTimestampFormat: {},
  timestampOptions: [
    { key: 'UTC', name: 'UTC' },
    { key: 'LOCAL_TIMEZONE', name: 'Local timezone' },
    { key: 'HUMAN_READABLE', name: 'Human readable' }
  ],
  async init() {
    this._super(...arguments);

    let selectedTimestampFormat = this.timestampOptions.find(
      timestamp => timestamp.key === 'HUMAN_READABLE'
    );
    const userSetting = await this.shuttle.getUserSetting();

    console.log('mehu', userSetting);

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

    console.log('mehu', userSetting);
    set(userSetting, 'timestampFormat', timestampFormat.key);
    await this.shuttle.updateUserSettings(userSetting);
  },

  actions: {
    async selectTimestampFormat(selectedTimestampFormat) {
      let timestampFormat = selectedTimestampFormat;

      debounce(this, this.updateTimestampFormat, timestampFormat, 1000);
    }
  }
});
