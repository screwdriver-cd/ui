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
      collections: this.store.findAll('collection'),
      pipelines: this.store.findAll('pipeline'),
      query: params.query
    };
  }
});
