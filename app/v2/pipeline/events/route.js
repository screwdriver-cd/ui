import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class NewPipelineEventsRoute extends Route {
  @service shuttle;

  async model() {
    const userSettings = await this.shuttle.fetchFromApi(
      'get',
      '/users/settings'
    );

    return {
      userSettings
    };
  }
}
