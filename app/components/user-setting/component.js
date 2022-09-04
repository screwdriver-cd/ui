import Component from '@ember/component';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import { or } from '@ember/object/computed';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Component.extend({
  store: service(),
  shuttle: service(),
  displayJobNameLength: 20,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,
  isDisabled: or('isSaving', 'isInvalid'),

  // Updating settings
  async init() {
    this._super(...arguments);

    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    const userSetting = await this.shuttle.getUserSetting();

    if (userSetting) {
      desiredJobNameLength = userSetting.displayJobNameLength;
    }

    this.setProperties({ desiredJobNameLength });
  },

  async updateUserSettings() {
    this.set('isSaving', true);
    const userSetting = await this.shuttle.getUserSetting();

    try {
      set(userSetting, 'displayJobNameLength', this.displayJobNameLength);
      await this.shuttle.updateUserSettings(userSetting);
      this.set('isSaving', false);
      this.set('successMessage', 'User setttings updated successfully!');
    } catch (error) {
      this.set('errorMessage', error);
    }
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
