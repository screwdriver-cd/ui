import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  template: service(),
  routeParams: computed('model', {
    get() {
      let route = this.get('model');
      let params = Object.assign({},
        route.paramsFor('templates.namespace'),
        route.paramsFor('templates.detail'),
      );

      return params;
    }
  }),
  crumbs: computed('routeParams', {
    get() {
      let breadcrumbs = [];
      let params = this.get('routeParams');

      // add name and namespace together to get full name, compare fullname  to params.name
      // if equal, use name
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
