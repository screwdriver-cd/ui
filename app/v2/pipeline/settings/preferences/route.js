import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsPreferencesRoute extends Route {
  @service('settings') settings;

  async model() {
    if (!this.settings.getSettings()) {
      await this.settings.fetchSettings();
    }
  }
}
