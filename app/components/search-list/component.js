import { computed, set } from '@ember/object';
import { empty } from '@ember/object/computed';
import { inject as service } from '@ember/service';
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
      const pipelines = this.filteredPipelines;

      return (
        Array.isArray(pipelines) && pipelines.length > 0 && this.moreToShow
      );
    }
  }),
  filteredPipelines: computed('pipelines', {
    get() {
      const filtered = this.pipelines;

      // add scm contexts into pipelines.
      return filtered.map(pipeline => {
        const scm = this.scmService.getScm(pipeline.get('scmContext'));

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
      const pipelinesPage = this.pipelinesPage + 1;
      const fn = this.updatePipelines;

      set(this, 'pipelinesPage', pipelinesPage);

      if (typeof fn === 'function') {
        fn({ page: pipelinesPage, search: this.query }).catch(error =>
          this.set('errorMessage', error)
        );
      }
    },
    openModal() {
      this.set('showModal', true);
    },
    addNewCollectionHelper() {
      const addNewCollectionParent = this.addNewCollection;

      addNewCollectionParent();
    },
    addToCollection(pipelineId, collection) {
      return this.addToCollection(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set(
            'addCollectionSuccess',
            `Successfully added Pipeline to Collection ${collection.get(
              'name'
            )}`
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
