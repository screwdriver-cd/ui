/* eslint ember/avoid-leaking-state-in-components: [2, ["pipelineSorting"]] */
import { computed, get, set } from '@ember/object';
import { empty } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import Component from '@ember/component';

export default Component.extend({
  errorMessage: '',
  showModal: false,
  session: service(),
  scmService: service('scm'),
  addCollectionError: null,
  addCollectionSuccess: null,
  isEmpty: empty('filteredPipelines'),
  showMore: computed('moreToShow', 'filteredPipelines', {
    get() {
      const pipelines = get(this, 'filteredPipelines');

      if (Array.isArray(pipelines) && pipelines.length < ENV.APP.NUM_PIPELINES_LISTED) {
        return false;
      }

      return get(this, 'moreToShow');
    }
  }),
  filteredPipelines: computed('pipelines', {
    get() {
      const { scmService } = this;
      let filtered = this.pipelines;

      // add scm contexts into pipelines.
      return filtered.map(pipeline => {
        const scm = scmService.getScm(pipeline.get('scmContext'));

        pipeline.set('scm', scm.displayName);
        pipeline.set('scmIcon', scm.iconType);

        return pipeline;
      });
    }
  }),
  init() {
    this._super(...arguments);

    set(this, 'pipelinesPage', 1);
  },
  /**
   * Reset show more when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);

    // Reset moreToShow value
    set(this, 'moreToShow', true);
  },
  actions: {
    moreClick() {
      const pipelinesPage = get(this, 'pipelinesPage') + 1;
      const fn = get(this, 'updatePipelines');

      set(this, 'pipelinesPage', pipelinesPage);

      if (typeof fn === 'function') {
        fn({ page: pipelinesPage, search: get(this, 'query') }).catch(error =>
          this.set('errorMessage', error)
        );
      }
    },
    openModal() {
      this.set('showModal', true);
    },
    addNewCollectionHelper() {
      let addNewCollectionParent = this.addNewCollection;

      addNewCollectionParent();
    },
    addToCollection(pipelineId, collection) {
      return this.addToCollection(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set(
            'addCollectionSuccess',
            `Successfully added Pipeline to Collection ${collection.get('name')}`
          );
        })
        .catch(() => {
          this.set(
            'addCollectionError',
            `Could not add Pipeline to Collection ${collection.get('name')}`
          );
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
