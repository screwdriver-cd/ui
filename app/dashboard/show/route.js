import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
const MAX_NUM_EVENTS_SHOWN = 20;

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    const collections = this.controllerFor('application').getWithDefault('collections', []);

    return this.store
      .findRecord('collection', params.collection_id, { reload: true })
      .then(collection => {
        return RSVP.hash({
          metricsMap: RSVP.hash(
            (collection.pipelineIds || []).reduce((oldMap, pipelineId) => {
              oldMap[pipelineId] = this.store.query('metric', {
                pipelineId,
                page: 1,
                count: MAX_NUM_EVENTS_SHOWN
              });

              return oldMap;
            }, {})
          ),
          collection,
          collections
        });
      });
  },

  actions: {
    error() {
      return this.transitionTo('/404');
    }
  }
});
