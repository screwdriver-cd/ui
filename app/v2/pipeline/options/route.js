import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { get } from '@ember/object';

export default class PipelineOptionsRoute extends Route {
  @service session;

  @service router;

  @service shuttle;

  constructor() {
    super(...arguments);
    // Reset error message when switching pages
    this.router.on('routeWillChange', (/* transition */) => {
      const pipelineOptionsController = this.controllerFor(
        'v2.pipeline.options'
      );

      pipelineOptionsController.set('errorMessage', '');
    });
  }

  async model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('v2.pipeline');
    const pipelineId = pipeline.id;

    const jobs = await this.shuttle.fetchJobs(pipelineId).catch (e) {
      console.error(e);
      return [];
    }

    return { pipeline, jobs };
  }
}
