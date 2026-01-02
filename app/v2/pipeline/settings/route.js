import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class V2PipelineSettingsRoute extends Route {
  @service router;

  @service session;

  beforeModel() {
    // Guests should not access this page
    if (this.session.data.authenticated.isGuest) {
      this.router.replaceWith('v2.pipeline');
    }
  }
}
