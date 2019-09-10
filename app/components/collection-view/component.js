/* eslint ember/avoid-leaking-state-in-components: [2, ["sortBy", "selectedPipelines"]] */
import { sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

const viewOptions = [
  {
    svgName: 'apps',
    value: 'Card'
  },
  {
    svgName: 'list',
    value: 'List'
  }
];

export default Component.extend({
  store: service(),
  session: service(),
  scmService: service('scm'),
  sortBy: ['scmRepo.name'],
  removePipelineError: null,
  activeViewOptionValue: viewOptions[0].value,
  viewOptions,
  isOrganizing: false,
  selectedPipelines: [],
  addCollectionError: null,

  isListView: computed('activeViewOptionValue', function isListView() {
    return this.activeViewOptionValue === viewOptions[1].value;
  }),

  showOperations: computed('selectedPipelines.length', function showOperations() {
    return this.selectedPipelines.length > 0;
  }),

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
        case 'lastEventTime:desc':
          return 'Last Event';
        default:
          return '';
      }
    }
  }),
  collectionPipelines: computed('collection.pipelines', {
    get() {
      const { scmService } = this;
      const getIcon = status => {
        switch (status) {
          case 'queued':
          case 'running':
            return 'refresh fa-spin';
          case 'success':
            return 'check-circle';
          case 'failure':
            return 'times-circle';
          case 'aborted':
            return 'stop-circle';
          case 'blocked':
            return 'ban';
          case 'unstable':
            return 'exclamation-circle';
          default:
            return '';
        }
      };

      const getColor = status => {
        switch (status) {
          case 'queued':
          case 'running':
            return 'build-running';
          case 'success':
            return 'build-success';
          case 'failure':
            return 'build-failure';
          case 'aborted':
            return 'build-failure';
          case 'blocked':
            return 'build-running';
          case 'unstable':
            return 'build-unstable';
          default:
            return '';
        }
      };

      const formatTime = duration => {
        const numOfTotalSeconds = Math.floor(duration / 1000);
        const minute = 60;
        const hour = 60 * minute;

        if (numOfTotalSeconds === 0) {
          return '0s';
        }
        if (numOfTotalSeconds < minute) {
          return `${numOfTotalSeconds}s`;
        }
        if (numOfTotalSeconds < hour) {
          const numOfMinutes = Math.floor(numOfTotalSeconds / minute);
          const numOfSeconds = numOfTotalSeconds % minute;

          return `${numOfMinutes}m ${numOfSeconds}s`;
        }
        const numOfHours = Math.floor(numOfTotalSeconds / hour);
        const numOfMinutes = Math.floor((numOfTotalSeconds % hour) / minute);
        const numOfSeconds = Math.floor(numOfTotalSeconds % minute);

        return `${numOfHours}h ${numOfMinutes}m ${numOfSeconds}s`;
      };

      if (this.get('collection.pipelines')) {
        return this.get('collection.pipelines').map(pipeline => {
          const scm = scmService.getScm(pipeline.scmContext);
          const { id, scmRepo, prs } = pipeline;
          const { branch, rootDir } = scmRepo;
          const events = this.eventsMap[pipeline.id];
          const ret = {
            id,
            scmRepo,
            branch: rootDir ? `${branch}#${rootDir}` : branch,
            scm: scm.displayName,
            scmIcon: scm.iconType,
            prs
          };

          if (events && events.length) {
            const lastEvent = events.get('firstObject');
            const lastEventStartTime = new Date(lastEvent.createTime);
            const lastEventStartYear = lastEventStartTime.getFullYear();
            const lastEventStartMonth = (lastEventStartTime.getMonth() + 1)
              .toString()
              .padStart(2, '0');
            const lastEventStartDay = lastEventStartTime
              .getDate()
              .toString()
              .padStart(2, '0');

            ret.eventsInfo = events.map(event => ({
              duration: event.duration,
              statusColor: getColor(event.status.toLowerCase())
            }));
            ret.lastEventInfo = {
              startTime: `${lastEventStartMonth}/${lastEventStartDay}/${lastEventStartYear}`,
              statusColor: getColor(lastEvent.status.toLowerCase()),
              durationText: formatTime(lastEvent.duration),
              sha: lastEvent.sha.substring(0, 7),
              icon: getIcon(lastEvent.status.toLowerCase()),
              commitMessage: lastEvent.commit.message,
              commitUrl: lastEvent.commit.url
            };
          } else {
            ret.eventsInfo = [];
            ret.lastEventInfo = {
              startTime: '--/--/----',
              statusColor: '$sd-no-build',
              durationText: '--',
              sha: 'Not available',
              icon: 'fas fa-question-circle',
              commitMessage: 'No events have been run for this pipeline',
              commitUrl: '#'
            };
          }

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
    pipelineRemove(pipelineId) {
      const collectionId = this.get('collection.id');

      return this.onPipelineRemove(+pipelineId)
        .then(() => {
          this.store.findRecord('collection', collectionId).then(collection => {
            this.setProperties({
              removePipelineError: null,
              collection
            });
          });
        })
        .catch(error => {
          this.set('removePipelineError', error.errors[0].detail);
        });
    },
    removeSelectedPipelines() {
      return this.removeMultiplePipelines(this.selectedPipelines, this.get('collection.id'))
        .then(() => {
          this.store.findRecord('collection', this.get('collection.id')).then(collection => {
            this.setProperties({
              removePipelineError: null,
              isOrganizing: false,
              collection
            });
          });
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
        case 'lastEventTime':
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
    },
    organize() {
      this.set('isOrganizing', true);
    },
    cancelOrganize() {
      this.setProperties({
        isOrganizing: false,
        selectedPipelines: []
      });
    },
    selectPipeline(pipelineId) {
      const newSelectedPipelines = this.selectedPipelines.slice(0);

      newSelectedPipelines.push(pipelineId);
      this.set('selectedPipelines', newSelectedPipelines);
    },
    deselectPipeline(pipelineId) {
      const idx = this.selectedPipelines.indexOf(pipelineId);
      const newSelectedPipelines = this.selectedPipelines.slice(0);

      if (idx !== -1) {
        newSelectedPipelines.splice(idx, 1);
        this.set('selectedPipelines', newSelectedPipelines);
      }
    },
    addMultipleToCollection(collection) {
      return this.addMultipleToCollection(this.selectedPipelines, collection.id)
        .then(() => {
          this.setProperties({
            addCollectionError: null,
            isOrganizing: false
          });
        })
        .catch(() => {
          this.set('addCollectionError', `Could not add Pipeline to Collection ${collection.name}`);
        });
    },
    resetView() {
      this.setProperties({
        isOrganizing: false,
        selectedPipelines: []
      });
    }
  }
});
