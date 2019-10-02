import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
const NUM_EVENTS_SHOWN = 20;

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    return this.store.findRecord('collection', params.collection_id).then(collection => {
      return RSVP.hash({
        eventsMap: RSVP.hash(
          (collection.pipelineIds || []).reduce((oldMap, pipelineId) => {
            oldMap[pipelineId] = this.store
              .query('event', {
                pipelineId,
                page: 1,
                count: NUM_EVENTS_SHOWN
              })
              .then(events => {
                return RSVP.all(events.getEach('builds')).then(() => {
                  return events;
                });
              });

            return oldMap;
          }, {})
        ),
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
