import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';

export default Component.extend({
  isSaving: false,
  errorMessage: '',
  showQuickStartGuide: false,
  shuttle: service(),
  store: service(),
  router: service(),
  templates: computed('allTemplates', {
    get() {
      const groupedTemplates = [];

      if (this.allTemplates) {
        const map = new Map();

        this.allTemplates.forEach(template => {
          const { namespace } = template;
          const templateCollection = map.get(namespace);

          template.groupName = namespace;
          if (!templateCollection) {
            map.set(namespace, [template]);
          } else {
            templateCollection.push(template);
          }
        });

        map.forEach((options, groupName) => {
          groupedTemplates.push({
            groupName,
            options
          });
        });
      }

      return groupedTemplates;
    }
  }),

  async init() {
    this._super(...arguments);
    const allTemplates = await this.shuttle.fetchAllTemplates();

    this.set('allTemplates', allTemplates);
  },

  actions: {
    async createPipeline({ scmUrl, rootDir, autoKeysGeneration, yaml }) {
      this.set('isSaving', true);

      const payload = {
        checkoutUrl: scmUrl,
        rootDir,
        autoKeysGeneration
      };

      let pipeline;

      try {
        pipeline = await this.store.createRecord('pipeline', payload).save();
        this.router.transitionTo('pipeline', pipeline.get('id'));
        if (!yaml) {
          this.set('showCreatePipeline', false);
        }
      } catch (err) {
        const error = err.errors[0] || {};

        if (
          error.status === 409 &&
          typeof error.data === 'object' &&
          error.data.existingId
        ) {
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
            const pipelineId = pipeline.get('id');

            let checkoutUrl = scmUrl;

            // Set branch if missing
            if (scmUrl.split('#').length === 1) {
              checkoutUrl = checkoutUrl.concat(`#${pipeline.get('branch')}`);
            }
            const pr = await this.shuttle.openPr(checkoutUrl, yaml, pipelineId);
            const { prUrl } = pr.payload;

            this.set('prUrl', prUrl);

            try {
              await this.router.transitionTo('pipeline.events', pipelineId);
              const ctrl = getOwner(this).lookup('controller:pipeline.events');
              const prLink = `<a href="${prUrl}" rel="noopener">${prUrl}</a>`;

              ctrl.set('errorMessage', `PR: ${prLink}`);
              this.set('showCreatePipeline', false);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('error', e);
            }
          }
        } catch (err) {
          const { payload: responsePayload } = err;

          const { message } = responsePayload;

          this.setProperties({
            isSaving: false,
            errorMessage: message
          });
        }
      }
    }
  }
});
