import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  theme: service('emt-themes/ember-bootstrap-v5'),
  timestampPreference: null,
  template: service(),
  store: service(),

  pipelineMetrics: computed('routeParams', {
    async get() {
      const { template } = this;
      const { name, namespace, version } = this.routeParams;

      return template.getTemplatePipelineUsage(name, namespace, version);
    }
  }),

  templateName: computed('routeParams.name', {
    async get() {
      return this.routeParams.name;
    }
  }),

  templateNamespace: computed('routeParams.namespace', {
    async get() {
      return this.routeParams.namespace;
    }
  }),

  templateVersion: computed('routeParams.version', {
    async get() {
      return this.routeParams.version;
    }
  }),

  hasUsers: computed('pipelineMetrics', {
    async get() {
      return (await this.pipelineMetrics).length > 0;
    }
  })
});
