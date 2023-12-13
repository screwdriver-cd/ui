import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { bool } from '@ember/object/computed';
import ENV from 'screwdriver-ui/config/environment';
import {
  TIMESTAMP_OPTIONS,
  TIMESTAMP_DEFAULT_OPTION
} from '../../utils/timestamp-format';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Controller.extend({
  isSaving: false,
  store: service(),
  shuttle: service(),
  userSettings: service(),
  displayJobNameLength: MINIMUM_JOBNAME_LENGTH,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,
  isDisabled: bool('isSaving'),
  successMessage: '',
  errorMessage: '',
  selectedTimestampFormat: {},
  timestampOptions: TIMESTAMP_OPTIONS,

  async init() {
    this._super(...arguments);

    let displayJobNameLength = MINIMUM_JOBNAME_LENGTH;

    let selectedTimestampFormat = this.get(
      `timestampOptions.${TIMESTAMP_DEFAULT_OPTION}`
    );

    const userPreferences = await this.userSettings.getUserPreference();

    if (userPreferences) {
      displayJobNameLength = userPreferences.displayJobNameLength;
      selectedTimestampFormat = this.timestampOptions.find(
        timestamp => timestamp.value === userPreferences.timestampFormat
      );
    }

    this.setProperties({
      displayJobNameLength,
      userPreferences,
      selectedTimestampFormat
    });
  },

  async updateUserSettings() {
    this.set('isSaving', true);
    this.userPreferences.set('displayJobNameLength', this.displayJobNameLength);
    this.userPreferences.set(
      'timestampFormat',
      this.selectedTimestampFormat.value
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
        // can be replaced with destroyRecord after ember-data 3.28
        this.store.deleteRecord(this.userPreferences);
        await this.userPreferences.save();
        this.userPreferences.unloadRecord();
        const newUserPreferences = await this.userSettings.getUserPreference();

        this.setProperties({
          successMessage: 'User settings reset successfully!',
          userPreferences: newUserPreferences
        });
      } catch (error) {
        this.set('errorMessage', error);
      } finally {
        this.set('isSaving', false);
      }
    }
  }
});
