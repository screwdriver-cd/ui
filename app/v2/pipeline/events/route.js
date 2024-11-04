import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service shuttle;

  async model() {
    const model = this.modelFor('v2.pipeline');

    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    return {
      ...model,
      userSettings
    };
  }
}
