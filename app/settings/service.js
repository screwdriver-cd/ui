import Service, { service } from '@ember/service';

export default class SettingsService extends Service {
  @service('shuttle') shuttle;

  settings;

  getSettings() {
    return this.settings;
  }

  getSettingsForPipeline(pipelineId) {
    return this.settings ? this.settings[pipelineId] || {} : {};
  }

  async fetchSettings() {
    await this.shuttle
      .fetchFromApi('get', '/users/settings')
      .then(settings => {
        this.settings = settings;
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        throw err;
      });
  }

  async updateSettings(newSettings) {
    await this.shuttle
      .fetchFromApi('put', '/users/settings', {
        settings: {
          ...newSettings
        }
      })
      .then(updatedSettings => {
        this.settings = updatedSettings;
      })
      .catch(err => {
        console.error('Error updating settings:', err);
        throw err;
      });
  }
}
