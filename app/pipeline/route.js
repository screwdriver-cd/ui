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
      pipeline: this.store.findRecord('pipeline', params.pipeline_id).catch(() => []),
      collections
    });
  },
  actions: {
    error(error) {
      if (error && Array.isArray(error.errors) && error.errors[0].status === 404) {
        this.transitionTo('/404');
      }

      return true;
    }
  },

  titleToken(model) {
    return get(model, 'pipeline.name');
  }
});
