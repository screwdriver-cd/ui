import Ember from 'ember';

export default Ember.Component.extend({
  session: Ember.inject.service(),
  scmService: Ember.inject.service('scm'),
  sortBy: ['scmRepo.name'],
  sortByText: Ember.computed('sortBy', {
    get() {
      switch (this.get('sortBy').get(0)) {
      case 'scmRepo.name':
        return 'Name';
      case 'lastBuildTime:desc':
        return 'Last Build';
      default:
        return '';
      }
    }
  }),
  collectionPipelines: Ember.computed('collection.pipelines', {
    get() {
      const scmService = this.get('scmService');

      if (this.get('collection.pipelines')) {
        return this.get('collection.pipelines').map((pipeline) => {
          const scm = scmService.getScm(pipeline.scmContext);
          const ret = {
            id: pipeline.id,
            scmRepo: pipeline.scmRepo,
            scm: scm.displayName,
            scmIcon: scm.iconType,
            workflow: pipeline.workflow,
            lastBuilds: pipeline.lastBuilds,
            prs: pipeline.prs
          };

          if (pipeline.lastBuilds && pipeline.lastBuilds.length) {
            const lastBuildsLength = pipeline.lastBuilds.length;
            const lastBuildObj = pipeline.lastBuilds[lastBuildsLength - 1];

            ret.lastBuildTime = new Date(lastBuildObj.createTime).valueOf();
          } else {
            ret.lastBuildTime = 0;
          }

          return ret;
        });
      }

      return [];
    }
  }),
  sortedPipelines: Ember.computed.sort('collectionPipelines', 'sortBy'),
  removePipelineError: null,
  actions: {
    /**
     * Action to remove a pipeline from a collection
     *
     * @param {Number} pipelineId - id of pipeline to remove
     * @param {Number} collectionId - id of collection to remove from
     * @returns {Promise}
     */
    pipelineRemove(pipelineId, collectionId) {
      return this.get('onPipelineRemove')(+pipelineId, collectionId)
        .then(() => {
          this.set('removePipelineError', null);
        })
        .catch((error) => {
          this.set('removePipelineError', error.errors[0].detail);
        });
    },
    setSortBy(option) {
      switch (option) {
      case 'name':
        this.set('sortBy', ['scmRepo.name']);
        break;
      case 'lastBuildTime':
        this.set('sortBy', [`${option}:desc`]);
        break;
      default:
        this.set('sortBy', [option]);
      }
    }
  }
});
