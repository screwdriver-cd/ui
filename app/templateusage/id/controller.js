import { inject as service } from '@ember/service';
import { all } from 'rsvp';
import { computed } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  userSettings: service(),
  theme: service('emt-themes/ember-bootstrap-v5'),
  timestampPreference: null,
  template: service(),
  store: service(),

  thisTemplate: computed({
    async get() {
      const { id, template } = this;
      const promise = template.getOneTemplateByIdWithMetrics(id);
      const resolved = await promise;

      console.log(resolved);

      return resolved;
    }
  }),

  pipelineIds: computed('thisTemplate', {
    async get() {
      return this.thisTemplate.then(t => t.metrics.pipelines.pipelineIds);
    }
  }),

  pipelines: computed('pipelineIds', {
    async get() {
      const { store } = this;
      const ids = await this.pipelineIds;

      return all(
        ids.map(id => {
          return store.findRecord('pipeline', id);
        })
      );
    }
  }),

  templateName: computed('thisTemplate', {
    async get() {
      return this.thisTemplate.then(t => t.name);
    }
  }),

  templateNamespace: computed('thisTemplate', {
    async get() {
      return this.thisTemplate.then(t => t.namespace);
    }
  }),

  templateVersion: computed('thisTemplate', {
    async get() {
      return this.thisTemplate.then(t => t.version);
    }
  }),

  hasUsers: computed('pipelineIds', {
    async get() {
      return this.pipelineIds.then(ids => ids.length > 0);
    }
  })
});
