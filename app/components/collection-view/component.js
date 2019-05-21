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
  description: computed('collection', {
    get() {
      let description = this.get('collection.description');

      if (!description) {
        return 'Add a description';
      }

      return description;
    }
  }),
  sortedPipelines: sort('collectionPipelines', 'sortBy'),
  sortByText: computed('sortBy', {
    get() {
      switch (this.sortBy.get(0)) {
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
      const { scmService } = this;

      if (this.get('collection.pipelines')) {
        return this.get('collection.pipelines').map(pipeline => {
          const scm = scmService.getScm(pipeline.scmContext);
          const { id, scmRepo, workflow, lastBuilds, prs } = pipeline;
          const { branch, rootDir } = scmRepo;
          const ret = {
            id,
            scmRepo,
            branch: rootDir ? `${branch}#${rootDir}` : branch,
            scm: scm.displayName,
            scmIcon: scm.iconType,
            workflow,
            lastBuilds,
            prs
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
      return this.onPipelineRemove(+pipelineId, collectionId)
        .then(() => {
          this.set('removePipelineError', null);
        })
        .catch(error => {
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
    },
    editDescription() {
      this.set('editingDescription', true);
    },
    editName() {
      this.set('editingName', true);
    },
    saveName() {
      const { collection } = this;
      let newName = this.$('.edit-area-name').val();

      if (newName) {
        collection.set('name', this.$('.edit-area-name').val());
        collection.save();
      }

      this.set('editingName', false);
    },
    saveDescription() {
      const { collection } = this;

      collection.set('description', this.$('.edit-area').val());
      this.set('editingDescription', false);
      collection.save();
    }
  }
});
