import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  queryParams: {
    query: {
      refreshModel: true,
      replace: true
    }
  },
  routeAfterAuthentication: 'search',
  titleToken: 'Search',
  model(params) {
    const pipelineListConfig = {
      page: 1,
      count: ENV.APP.NUM_PIPELINES_LISTED
    };

    if (params && params.query) {
      pipelineListConfig.search = params.query;
    }

    return RSVP.hash({
      pipelines: this.store.query('pipeline', pipelineListConfig),
      collections: this.store.findAll('collection'),
      query: params.query
    });
  }
});
