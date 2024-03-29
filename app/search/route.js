import Route from '@ember/routing/route';
import ENV from 'screwdriver-ui/config/environment';
import RSVP from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  queryParams: {
    query: {
      refreshModel: true,
      replace: true
    }
  },
  routeAfterAuthentication: 'search',
  model(params) {
    const pipelineListConfig = {
      page: 1,
      count: ENV.APP.NUM_PIPELINES_LISTED,
      sortBy: 'name',
      sort: 'ascending'
    };

    if (params && params.query) {
      pipelineListConfig.search = params.query.replace(/\s/g, '');
    }

    return RSVP.hash({
      pipelines: this.store.query('pipeline', pipelineListConfig),
      collections: this.store.findAll('collection').catch(() => []),
      query: params.query
    });
  }
});
