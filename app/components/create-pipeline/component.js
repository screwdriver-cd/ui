import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ArrayProxy from '@ember/array/proxy';

const ArrayPromiseProxy = ArrayProxy.extend(PromiseProxyMixin);

export default Component.extend({
  isSaving: false,
  errorMessage: '',
  showQuickStartGuide: false,
  shuttle: service(),
  store: service(),

  templates: computed({
    get() {
      return ArrayPromiseProxy.create({
        promise: this.shuttle.fetchAllTemplates()
      });
    }
  }),

  actions: {
    async createPipeline({ scmUrl, rootDir, yaml }) {
      this.set('isSaving', true);

      let payload = {
        checkoutUrl: scmUrl,
        rootDir
      };
      let pipeline;

      try {
        if (yaml && yaml.length) {
          pipeline = await this.shuttle.openPr(scmUrl, yaml);
        } else {
          pipeline = await this.store.createRecord('pipeline', payload).save();
        }
        this.transitionToRoute('pipeline', pipeline.get('id'));
      } catch (err) {
        if (yaml && yaml.length) {
          const { payload: errorPayload } = err;
          const { /* statusCode, error, */ message } = errorPayload;

          this.set('errorMessage', message);
        } else {
          let error = err.errors[0] || {};

          if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
            this.transitionToRoute('pipeline', error.data.existingId);
          } else {
            this.set('errorMessage', error.detail);
          }
        }
      } finally {
        this.set('isSaving', false);
      }
    }
  }
});
