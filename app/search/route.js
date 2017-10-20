import Route from '@ember/routing/route';

export default Route.extend({
  queryParams: {
    query: {
      refreshModel: true,
      replace: true
    }
  },
  routeAfterAuthentication: 'search',
  titleToken: 'Search',
  model(params) {
    return {
      pipelines: this.store.findAll('pipeline'),
      collections: this.store.findAll('collection'),
      query: params.query
    };
  }
});
