import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  queryParams: {
    query: {
      refreshModel: true,
      replace: true
    }
  },
  routeAfterAuthentication: 'pipeline-visualizer',
  titleToken: 'Pipeline Visualizer',
});
