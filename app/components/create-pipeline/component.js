import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ArrayProxy from '@ember/array/proxy';
import { getOwner } from '@ember/application';

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
        pipeline = await this.store.createRecord('pipeline', payload).save();
        this.router.transitionTo('pipeline', pipeline.get('id'));
      } catch (err) {
        let error = err.errors[0] || {};

        if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
          const { existingId } = error.data;
          const existingPiplineLink = `<a href="/pipelines/${existingId}" rel="noopener">take me there</a>`;
          const errorMessage = `Pipeline ${existingId} already exists, ${existingPiplineLink}`;

          this.set('errorMessage', errorMessage);
        } else {
          this.set('errorMessage', error.detail);
        }
      } finally {
        this.set('isSaving', false);
      }

      if (pipeline) {
        try {
          if (yaml && yaml.length) {
            const pr = await this.shuttle.openPr(scmUrl, yaml);
            const { prUrl } = pr.payload;

            this.set('prUrl', prUrl);

            const { router } = this;

            this.router
              .transitionTo('pipeline.events', pipeline.get('id'))
              .then(() => {
                const ctrl = getOwner(router).lookup('controller:pipeline.events');
                const prLink = `<a href="${prUrl}" rel="noopener">${prUrl}</a>`;

                ctrl.set('errorMessage', `PR: ${prLink}`);
              })
              .catch(e => {
                console.error('error', e);
              });
          }
        } catch (err) {
          const { payload: responsePayload } = err;
          let { message } = responsePayload;

          this.setProperties({
            isSaving: false,
            errorMessage: message
          });
        }
      }
    }
  }
});
