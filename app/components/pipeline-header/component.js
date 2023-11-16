import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  showCollectionModal: false,
  scmService: service('scm'),
  pipelineService: service('pipeline'),
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
  sameRepoPipeline: computed('pipeline', {
    get() {
      const repositoryUri = this.pipeline.scmUri.substring(0,this.pipeline.scmUri.indexOf(':', this.pipeline.scmUri.indexOf(':') + 1))
      return this.pipelineService.getSiblingPipeline(this.pipeline.scmRepo.name).then(value =>
        value.toArray().filter(pipe => pipe.id !== this.pipeline.id && repositoryUri === pipe.scmUri.substring(0,pipe.scmUri.indexOf(':', pipe.scmUri.indexOf(':') + 1))).map((pipe, i) => ({
          index: i,
          url: `/pipelines/${pipe.id}`,
          branchAndRootDir: pipe.scmRepo.rootDir ? `${pipe.scmRepo.branch}:${pipe.scmRepo.rootDir}` : pipe.scmRepo.branch
        }))
      );
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
          this.set(
            'addCollectionSuccess',
            `Successfully added Pipeline to ${collection.get('name')}`
          );
        })
        .catch(() => {
          this.set(
            'addCollectionError',
            `Could not add Pipeline to ${collection.get('name')}`
          );
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
