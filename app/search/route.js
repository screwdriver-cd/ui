import Ember from 'ember';

export default Ember.Route.extend({
  routeAfterAuthentication: 'search',
  titleToken: 'Search',
  queryParams: {
    query: {
      refreshModel: true,
      replace: true
    }
  },
  model(params) {
    return {
      pipelines: this.store.findAll('pipeline'),
      query: params.query
    };
  }
});
