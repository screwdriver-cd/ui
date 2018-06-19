/* eslint ember/avoid-leaking-state-in-components: [2, ["sortBy"]] */
import { sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  scmService: service('scm'),
  sortBy: ['scmRepo.name'],
  removePipelineError: null,
  sortedPipelines: sort('collectionPipelines', 'sortBy'),
  sortByText: computed('sortBy', {
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
  collectionPipelines: computed('collection.pipelines', {
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
            ret.lastBuildStatus = lastBuildObj.status.toLowerCase();
          } else {
            ret.lastBuildTime = 0;
            ret.lastBuildStatus = '';
          }

          [ret.lastBuildIcon, ret.lastBuildStatusColor] = (() => {
            switch (ret.lastBuildStatus) {
            case 'queued':
            case 'running':
              return ['refresh fa-spin', 'build-running'];
            case 'success':
              return ['check-circle', 'build-success'];
            case 'failure':
              return ['times-circle', 'build-failure'];
            case 'aborted':
              return ['stop-circle', 'build-failure'];
            case 'blocked':
              return ['ban', 'build-running'];
            case 'unstable':
              return ['exclamation-circle', 'build-unstable'];
            default:
              return ['', ''];
            }
          })();

          return ret;
        });
      }

      return [];
    }
  }),

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
