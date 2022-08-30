import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import { or } from '@ember/object/computed';

export default Component.extend({
  shuttle: service(),
  selectedTimestampFormat: {},
  timestampOptions: [
    { key: 'UTC', name: 'UTC' },
    { key: 'LOCAL_TIMEZONE', name: 'Local Timezone' }
  ],
  isDisabled: or('isSaving', 'isInvalid'),

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
  async updateUserSettings() {
    this.set('isSaving', true);
    const userSetting = await this.shuttle.getUserSetting();

    set(userSetting, 'timestampFormat', this.selectedTimestampFormat.key);

    await this.shuttle.updateUserSettings(userSetting);
    this.set('isSaving', false);

    this.set('successMessage', 'User setttings updated successfully!');
  },

  actions: {
    async updateUserSettings() {
      this.updateUserSettings();
    },
    async resetUserSettings() {
      this.set('isSaving', true);
      try {
        await this.shuttle.deleteUserSettings();
        this.set('isSaving', false);
        this.set('successMessage', 'Timestamp preference reseted successfully');
      } catch {
        this.set('isSaving', false);
        this.set(
          'errorMessage',
          'Error occured while resetting Timestamp preference, Please try again'
        );
      }
    }
  }
});
