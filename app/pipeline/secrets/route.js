import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  store: service(),
  router: service(),
  routeAfterAuthentication: 'pipeline.secrets',
  titleToken: 'Secrets',
  model() {
    //Refresh error message
    this.controllerFor('pipeline.secrets').set('errorMessage', '');

    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.router.transitionTo('pipeline');
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
});
