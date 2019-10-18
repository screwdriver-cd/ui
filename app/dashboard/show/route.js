import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
const MAX_NUM_EVENTS_SHOWN = 20;

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    return this.store.findRecord('collection', params.collection_id).then(collection => {
      return RSVP.hash({
        metricsMap: collection.pipelineIds.map(pipelineId => {
          return this.store.query('metric', {
            pipelineId,
            page: 1,
            count: MAX_NUM_EVENTS_SHOWN
          });
        }),
        collection,
        collections: this.store.findAll('collection').catch(() => [])
      });
    });
  },

  actions: {
    error() {
      return this.transitionTo('/404');
    }
  }
});
