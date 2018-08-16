import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { get, set } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'pipeline',
  model(params) {
    set(this, 'pipelineId', params.pipeline_id);

    const collections = get(this, 'store').findAll('collection').catch(() => []);

    return RSVP.hash({
      pipeline: get(this, 'store').findRecord('pipeline', params.pipeline_id),
      events: get(this, 'store').query('event', { pipelineId: params.pipeline_id, page: 1 })
        .then((events) => {
          console.log('events!: ', events);

          return events;
        }),
      collections
    });
  },
  actions: {
    error(error) {
      if (error.errors[0].status === 404) {
        this.transitionTo('/404');
      }

      return true;
    }
  },

  titleToken(model) {
    return get(model, 'appId');
  }
});
