import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  routeParams: computed('model', {
    get() {
      let route = this.get('model');

      let params = Object.assign({},
        route.paramsFor('templates.namespace'),
        route.paramsFor('templates.detail')
      );

      return params;
    }
  }),
  crumbs: computed('routeParams', {
    get() {
      let breadcrumbs = [];
      let params = this.get('routeParams');

      if (params.namespace || params.detail) {
        breadcrumbs.push({
          name: 'Templates',
          params: ['templates']
        });
      }

      if (params.namespace) {
        breadcrumbs.push({
          name: params.namespace,
          params: ['templates.namespace', params.namespace]
        });
      }

      if (params.name) {
        breadcrumbs.push({
          name: params.name,
          params: ['templates.detail', params.namespace, params.name]
        });
      }

      return breadcrumbs;
    }
  })
});
