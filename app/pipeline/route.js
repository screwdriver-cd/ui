import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { get, set } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'pipeline',
  model(params) {
    set(this, 'pipelineId', params.pipeline_id);

    const collections = this.store.findAll('collection').catch(() => []);

    return RSVP.hash({
      pipeline: this.store
        .findRecord('pipeline', params.pipeline_id)
        .catch(() => {
          this.transitionTo('/404');

          return [];
        }),
      collections
    });
  },
  actions: {
    error(error) {
      if (
        error &&
        Array.isArray(error.errors) &&
        error.errors[0].status === 404
      ) {
        if (error.errors[0].detail === 'Build does not exist') {

          const pipelineEventsController =
            this.controllerFor('pipeline.events');

          pipelineEventsController.set('errorMessage', 'Build does not exist');
          this.transitionTo('pipeline.index');

          return false;
        }
      }

      return true;
    }
  },

  titleToken(model) {
    return get(model, 'pipeline.name');
  }
});
