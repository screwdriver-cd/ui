import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  template: service(),
  routeParams: computed('model', {
    get() {
      const route = this.model;

      const params = {
        ...route.paramsFor('templates.namespace'),
        ...route.paramsFor('templates.detail')
      };

      return params;
    },
    set(_, value) {
      this.set('_routeParams', value);

      return value;
    }
  }),
  crumbs: computed('routeParams', {
    get() {
      const breadcrumbs = [];

      const params = this.routeParams;

      // add name and namespace together to get full name, compare fullname  to params.name
      // if equal, use name
      if (params.namespace || params.detail) {
        breadcrumbs.push({
          name: 'Templates',
          route: 'templates',
          params: ['templates']
        });
      }

      if (params.namespace) {
        breadcrumbs.push({
          name: params.namespace,
          route: `templates.namespace`,
          params: [params.namespace]
        });
      }

      if (params.name) {
        breadcrumbs.push({
          name: params.name,
          route: `templates.detail`,
          params: [params.namespace, params.name]
        });
      }

      return breadcrumbs;
    },
    set(_, value) {
      this.set('_crumbs', value);

      return value;
    }
  })
});
