import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import timeRange from 'screwdriver-ui/utils/time-range';

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    const { startTime, endTime } = timeRange(new Date(), '1mo');

    return this.store.findRecord('collection', params.collection_id).then(collection => {
      return RSVP.hash({
        metricsMap: RSVP.hash(
          (collection.pipelineIds || []).reduce((oldMap, pipelineId) => {
            oldMap[pipelineId] = this.store.query('metric', {
              pipelineId,
              startTime,
              endTime
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
