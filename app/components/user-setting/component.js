import Component from '@ember/component';
import { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import { or } from '@ember/object/computed';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Component.extend({
  store: service(),
  shuttle: service(),
  userSettings: service(),
  displayJobNameLength: 20,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,
  isDisabled: or('isSaving', 'isInvalid'),

  // Updating settings
  async init() {
    this._super(...arguments);

    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    const userSetting = await this.userSettings.getUserPreference();

    if (userSetting) {
      desiredJobNameLength = userSetting.displayJobNameLength;
    }

    this.setProperties({ desiredJobNameLength });
  },

  async updateUserSettings() {
    this.set('isSaving', true);
    const userSetting = await this.userSettings.getUserPreference();

    userSetting.set('displayJobNameLength', this.displayJobNameLength);

    try {
      userSetting.save();
      this.setProperties({
        isSaving: false,
        successMessage: 'User settings updated successfully!'
      });
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
        this.setProperties({
          isSaving: false,
          successMessage: 'User settings reset successfully!'
        });
      } catch {
        this.set({
          isSaving: false,
          errorMessage:
            'Error occured while resetting user settings, Please try again'
        });
      }
    }
  }
});
