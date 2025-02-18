import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineSecretsRoute extends Route {
  @service router;

  @service session;

  @service shuttle;

  @service pipelinePageState;

  async beforeModel() {
    // Guests should not access this page
    if (this.session.data.authenticated.isGuest) {
      this.router.replaceWith('v2.pipeline');
    }
  }

  async model() {
    // Refresh error message
    this.controllerFor('v2.pipeline.secrets').set('errorMessage', '');

    const pipeline = this.pipelinePageState.getPipeline();
    const pipelineId = pipeline.id;

    const secrets = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/secrets`)
      .catch(err => {
        this.controllerFor('v2.pipeline.secrets').set(
          'errorMessage',
          err.message
        );

        return [];
      });

    const tokens = await this.shuttle
      .fetchFromApi('get', `/pipelines/${pipelineId}/tokens`)
      .catch(err => {
        this.controllerFor('v2.pipeline.secrets').set(
          'errorMessage',
          err.message
        );

        return [];
      });

    return { pipeline, secrets, tokens };
  }
}
