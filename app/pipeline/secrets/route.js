import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),
  routeAfterAuthentication: 'pipeline.secrets',
  titleToken: 'Secrets',
  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('pipeline');
    }

    const pipeline = this.modelFor('pipeline').pipeline;
    const secrets = pipeline.get('secrets');

    this.get('store').unloadAll('token');

    return this.get('store')
      .findAll('token', { adapterOptions: { pipelineId: pipeline.get('id') } })
      .then(tokens => ({
        tokens,
        secrets,
        pipeline
      }));
  }
});
