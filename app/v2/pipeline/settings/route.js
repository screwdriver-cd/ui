import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsRoute extends Route {
  @service session;

  beforeModel() {
    // Guests should not access this page
    if (this.session.data.authenticated.isGuest) {
      this.replaceWith('v2.pipeline');
    }
  }
}
