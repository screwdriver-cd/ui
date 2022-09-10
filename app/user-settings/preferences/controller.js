import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { or } from '@ember/object/computed';
import ENV from 'screwdriver-ui/config/environment';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Controller.extend({
  store: service(),
  shuttle: service(),
  userSettings: service(),
  displayJobNameLength: 20,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,
  isDisabled: or('isSaving', 'isInvalid'),

  async init() {
    this._super(...arguments);
    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    const userSetting = await this.userSettings.getUserPreference();

    if (userSetting) {
      desiredJobNameLength = userSetting.displayJobNameLength;
    }

    this.setProperties({ desiredJobNameLength, userSetting });
  },

  async updateUserSettings() {
    this.set('isSaving', true);

    this.userSetting.set('displayJobNameLength', this.displayJobNameLength);

    try {
      await this.userSetting.save();
      this.setProperties({
        isSaving: false,
        successMessage: 'User settings updated successfully!'
      });
    } catch (error) {
      this.setProperties({
        isSaving: false,
        errorMessage: error
      });
    }
  },

  actions: {
    async updateUserSettings() {
      this.updateUserSettings();
    },
    async resetUserSettings() {
      this.set('isSaving', true);

      try {
        await this.store.deleteRecord(this.userSetting);

        this.setProperties({
          isSaving: false,
          successMessage: 'User settings reset successfully!'
        });
      } catch (error) {
        this.setProperties({
          isSaving: false,
          errorMessage: error
        });
      }
    }
  }
});
