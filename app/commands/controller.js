import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  router: service(),
  routeParams: computed('model', {
    get() {
      const route = this.model;

      const params = {
        ...route.paramsFor('commands.namespace'),
        ...route.paramsFor('commands.detail')
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

      if (params.namespace || params.detail) {
        breadcrumbs.push({
          name: 'Commands',
          route: 'commands',
          params: ['commands']
        });
      }

      if (params.namespace) {
        breadcrumbs.push({
          name: params.namespace,
          route: 'commands.namespace',
          params: [params.namespace]
        });
      }

      if (params.name) {
        breadcrumbs.push({
          name: params.name,
          route: 'commands.detail',
          params: [params.namespace, params.name]
        });
      }

      return breadcrumbs;
    },
    set(_, value) {
      return (this._crumbs = value);
    }
  })
});
