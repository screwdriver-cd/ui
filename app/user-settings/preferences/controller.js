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
  selectedTimestampFormat: {},
  timestampOptions: [
    { key: 'UTC', name: 'UTC' },
    { key: 'LOCAL_TIMEZONE', name: 'Local Timezone' }
  ],

  async init() {
    this._super(...arguments);
    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    let selectedTimestampFormat = this.timestampOptions.find(
      timestamp => timestamp.key === 'LOCAL_TIMEZONE'
    );
    const userPreferences = await this.userSettings.getUserPreference();

    if (userPreferences) {
      desiredJobNameLength = userPreferences.displayJobNameLength;
      selectedTimestampFormat = this.timestampOptions.find(
        timestamp => timestamp.key === userPreferences.timestampFormat
      );
    }

    this.setProperties({
      desiredJobNameLength,
      userPreferences,
      selectedTimestampFormat
    });
  },

  async updateUserSettings() {
    this.set('isSaving', true);
    this.userPreferences.set('displayJobNameLength', this.displayJobNameLength);
    this.userPreferences.set(
      'timestampFormat',
      this.selectedTimestampFormat.key
    );
    try {
      await this.userPreferences.save();
      this.set('successMessage', 'User settings updated successfully!');
    } catch (error) {
      this.set('errorMessage', error);
    } finally {
      this.set('isSaving', false);
    }
  },

  actions: {
    async updateUserSettings() {
      this.updateUserSettings();
    },
    async resetUserSettings() {
      this.set('isSaving', true);

      try {
        await this.store.deleteRecord(this.userPreferences);
        await this.userPreferences.save();
        this.set('successMessage', 'User settings reset successfully!');
      } catch (error) {
        this.set('errorMessage', error);
      } finally {
        this.set('isSaving', false);
      }
    }
  }
});