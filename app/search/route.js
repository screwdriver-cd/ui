import Route from '@ember/routing/route';
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
    return {
      pipelines: this.store.findAll('pipeline'),
      collections: this.store.findAll('collection'),
      query: params.query
    };
  }
});
