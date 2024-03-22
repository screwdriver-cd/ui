import Controller from '@ember/controller';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  template: service(),
  router: service(),
  isPipelineTemplatePage: computed('router.currentRouteName', {
    get() {
      const currentRouteName = get(this, 'router.currentRouteName');
      const isPipelineTemplateRoute = currentRouteName.includes('pipeline');

      return isPipelineTemplateRoute;
    }
  }),
  routeParams: computed('model', 'isPipelineTemplatePage', {
    get() {
      const route = this.model;

      let paramRouteName = 'job';

      if (this.isPipelineTemplatePage) {
        paramRouteName = 'pipeline';
      }

      const params = {
        ...route.paramsFor(`templates.${paramRouteName}.namespace`),
        ...route.paramsFor(`templates.${paramRouteName}.detail`)
      };

      console.log('routeParams', params);

      return params;
    },
    set(_, value) {
      this.set('_routeParams', value);

      return value;
    }
  }),
  crumbs: computed('routeParams', 'isPipelineTemplatePage', {
    get() {
      const breadcrumbs = [];
      const params = this.routeParams;

      let paramRouteName = 'job';

      if (this.isPipelineTemplatePage) {
        paramRouteName = 'pipeline';
      }

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
          route: `templates.${paramRouteName}.namespace`,
          params: [params.namespace]
        });
      }

      if (params.name) {
        breadcrumbs.push({
          name: params.name,
          route: `templates.${paramRouteName}.detail`,
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
