import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
// import ObjectProxy from '@ember/object/proxy';
import ArrayProxy from '@ember/array/proxy';

const ArrayPromiseProxy = ArrayProxy.extend(PromiseProxyMixin);

export default Component.extend({
  isSaving: false,
  errorMessage: '',
  showQuickStartGuide: false,
  // templates: [],
  shuttle: service(),

  templates: computed({
    get() {
      return ArrayPromiseProxy.create({
        promise: this.shuttle.fetchAllTemplates()
      });
    }
  }),

  async init() {
    this._super(...arguments);

    // const templates = await this.shuttle.fetchAllTemplates();
    // this.set('templates', templates);
  },

  actions: {
    createPipeline({ scmUrl, rootDir, files }) {
      let payload = {
        checkoutUrl: scmUrl,
        rootDir,
        files,
        scmUri: scmUrl,
        title: 'onboard to screwdriver',
        message: 'add screwdriver.yaml file'
      };

      let pipeline = this.store.createRecord('pipeline', payload);

      this.set('isSaving', true);

      pipeline
        .save()
        .then(
          () => {
            this.transitionToRoute('pipeline', pipeline.get('id'));
          },
          err => {
            let error = err.errors[0] || {};

            if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
              this.transitionToRoute('pipeline', error.data.existingId);
            } else {
              this.set('errorMessage', error.detail);
            }
          }
        )
        .finally(() => {
          this.set('isSaving', false);
        });
    }
  }
});
