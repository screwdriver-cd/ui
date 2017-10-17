import Route from '@ember/routing/route';

export default Route.extend({
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
      collections: this.store.findAll('collection'),
      query: params.query
    };
  }
});
