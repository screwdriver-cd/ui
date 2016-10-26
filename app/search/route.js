import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Search',
  queryParams: {
    query: {
      refreshModel: false,
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
