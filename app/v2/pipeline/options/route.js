import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PipelineOptionsRoute extends Route {
  @service session;

  @service router;

  @service shuttle;

  @service pipelinePageState;

  beforeModel(transition) {
    // Guests should not access this page
    if (this.session.data.authenticated.isGuest) {
      this.replaceWith('v2.pipeline');
    } else {
      this.replaceWith(
        'pipeline.options',
        transition.to.parent.params.pipeline_id
      );
    }

    // Reset error message when switching pages
    this.router.on('routeWillChange', (/* transition */) => {
      const pipelineOptionsController = this.controllerFor(
        'v2.pipeline.options'
      );

      pipelineOptionsController.set('errorMessage', '');
    });
  }

  async model() {
    const pipeline = this.pipelinePageState.getPipeline();
    const pipelineId = pipeline.id;

    const jobs = await this.shuttle.fetchJobs(pipelineId).catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);

      return [];
    });

    return { pipeline, jobs };
  }
}
