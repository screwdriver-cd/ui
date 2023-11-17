import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  templateToRemove: null,
  scmUrl: null,
  isRemoving: false,
  showToggleTrustModal: false,
  store: service(),
  isTrusted: null,
  init() {
    this._super(...arguments);
    this.store
      .findRecord('pipeline', this.template.pipelineId)
      .then(pipeline => {
        this.set('scmUrl', pipeline.scmRepo.url);
      })
      .catch(() => {
        this.set('scmUrl', null);
      });

    this.set('isTrusted', this.template.trusted);
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
    showToggleTrustModal() {
      this.set('showToggleTrustModal', true);
    },
    cancelToggleTrustModal() {
      this.set('showToggleTrustModal', false);
    },
    updateTrust(fullName, toTrust) {
      this.onUpdateTrust(fullName, toTrust);
      this.set('isTrusted', toTrust);
      this.set('showToggleTrustModal', false);
    }
  }
});
