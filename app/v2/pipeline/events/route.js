import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service('pipeline-page-state') pipelinePageState;

  @service('settings') settings;

  beforeModel() {
    this.pipelinePageState.setRoute(this.routeName);
    this.pipelinePageState.forceReloadPipelineHeader();
  }

  async model() {
    if (!this.settings.getSettings()) {
      await this.settings.fetchSettings();
    }
  }
}
