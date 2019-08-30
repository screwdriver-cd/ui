import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  templateToRemove: null,
  scmUrl: null,
  isRemoving: false,
  store: service(),
  init() {
    this._super(...arguments);
    this.store
      .findRecord('pipeline', this.template.pipelineId)
      .then(pipeline => {
        this.set('scmUrl', pipeline.get('scmRepo.url'));
      })
      .catch(() => {
        this.set('scmUrl', null);
      });
  },
  actions: {
    setTemplateToRemove(template) {
      this.set('templateToRemove', template);
    },
    cancelRemovingTemplate() {
      this.set('templateToRemove', null);
      this.set('isRemoving', false);
    },
    removeTemplate(name) {
      this.set('isRemoving', true);
      this.onRemoveTemplate(name).then(() => {
        this.set('templateToRemove', null);
        this.set('isRemoving', false);
      });
    },
    updateTrust(fullName, toTrust) {
      this.set('trusted', toTrust);
      this.onUpdateTrust(fullName, toTrust);
    }
  }
});
