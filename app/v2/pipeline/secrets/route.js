import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineSecretsRoute extends Route {
  @service session;

  async beforeModel() {
    // Guests should not access this page
    if (this.session.data.authenticated.isGuest) {
      this.replaceWith('v2.pipeline');
    }
  }
}
