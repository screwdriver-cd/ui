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
  router: service(),
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
        }
      } catch (err) {
        const { payload: responsePayload } = err;
        let { statusCode, message } = responsePayload;

        if (statusCode === '500') {
          this.setProperties({
            isSaving: false,
            errorMessage: message
          });

          return;
        }

        // statusCode: 201
        if (typeof responsePayload === 'string') {
          this.set('prLink', responsePayload);
        }
      }

      try {
        pipeline = await this.store.createRecord('pipeline', payload).save();
        this.router.transitionTo('pipeline', pipeline.get('id'));
      } catch (err) {
        let error = err.errors[0] || {};

        if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
          const { existingId } = error.data;

          this.set('errorMessage', `Pipeline ${existingId} already exists`);
          this.router.transitionTo('pipeline', existingId);
        } else {
          this.set('errorMessage', error.detail);
        }
      } finally {
        this.set('isSaving', false);
      }
    }
  }
});
