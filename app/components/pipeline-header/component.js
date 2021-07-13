import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  showCollectionModal: false,
  scmService: service('scm'),
  classNames: ['row'],
  classNameBindings: ['isBuildPage'],
  router: service(),
  addCollectionError: null,
  addCollectionSuccess: null,
  dropdownText: 'Add to collection',
  isBuildPage: computed('router.currentRouteName', {
    get() {
      return get(this, 'router.currentRouteName') === 'pipeline.build';
    }
  }),
  scmContext: computed('pipeline', {
    get() {
      const scm = this.scmService.getScm(this.pipeline.get('scmContext'));

      return {
        scm: scm.displayName,
        scmIcon: scm.iconType
      };
    }
  }),
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(pipelineId, collection) {
      return this.addToCollection(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set('addCollectionSuccess', `Successfully added Pipeline to ${collection.get('name')}`);
        })
        .catch(() => {
          this.set('addCollectionError', `Could not add Pipeline to ${collection.get('name')}`);
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
