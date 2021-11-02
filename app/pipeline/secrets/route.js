import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get } from '@ember/object';

@classic
export default class SecretsRoute extends Route {
  @service
  session;

  routeAfterAuthentication = 'pipeline.secrets';

  titleToken = 'Secrets';

  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('pipeline');
    const secrets = pipeline.get('secrets');

    this.store.unloadAll('token');

    return this.store
      .findAll('token', { adapterOptions: { pipelineId: pipeline.get('id') } })
      .then(tokens => ({
        tokens,
        secrets,
        pipeline
      }))
      .catch(error => {
        this.controllerFor('pipeline.secrets').set(
          'errorMessage',
          error.errors[0].detail
        );

        return { secrets, pipeline };
      });
  }
}
