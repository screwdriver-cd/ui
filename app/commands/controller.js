import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  routeParams: computed('model', {
    get() {
      let route = this.model;
      let params = Object.assign(
        {},
        route.paramsFor('commands.namespace'),
        route.paramsFor('commands.detail')
      );

      return params;
    }
  }),
  crumbs: computed('routeParams', {
    get() {
      let breadcrumbs = [];
      let params = this.routeParams;

      if (params.namespace || params.detail) {
        breadcrumbs.push({
          name: 'Commands',
          params: ['commands']
        });
      }

      if (params.namespace) {
        breadcrumbs.push({
          name: params.namespace,
          params: ['commands.namespace', params.namespace]
        });
      }

      if (params.name) {
        breadcrumbs.push({
          name: params.name,
          params: ['commands.detail', params.namespace, params.name]
        });
      }

      return breadcrumbs;
    }
  })
});
