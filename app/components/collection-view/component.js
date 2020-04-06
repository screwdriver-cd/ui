/* eslint ember/avoid-leaking-state-in-components: [2, ["sortBy", "selectedPipelines", "searchedPipelines", "selectedSearchedPipelines", "metricsMap"]] */
import { sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

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
  collection: null,
  metricsMap: [],
  removePipelineError: null,
  activeViewOptionValue: localStorage.getItem('activeViewOptionValue') || viewOptions[0].value,
  viewOptions,
  isOrganizing: false,
  selectedPipelines: [],
  addCollectionError: null,
  showSettingModal: false,
  showAddPipelineModal: false,
  collectionName: null,
  collectionDescription: null,
  searchedPipelines: [],
  selectedSearchedPipelines: [],
  linkCopied: '',
  reset: false,

  showViewSwitch: computed('collection.pipelineIds', function showViewSwitch() {
    return this.collection.pipelineIds.length !== 0;
  }),

  showOrganizeButton: computed(
    'session.isAuthenticated',
    'collection.pipelineIds',
    function showOrganizeButton() {
      return this.session.isAuthenticated && this.collection.pipelineIds.length !== 0;
    }
  ),

  isListView: computed('activeViewOptionValue', function isListView() {
    localStorage.setItem('activeViewOptionValue', this.activeViewOptionValue);

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
          case 'frozen':
            return 'minus-circle';
          default:
            return 'question-circle';
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
          case 'frozen':
            return 'build-frozen';
          default:
            return 'build-unknown';
        }
      };

      const formatTime = duration => {
        const numOfTotalSeconds = duration;
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

      const getSha = sha => sha.substring(0, 7);

      let viewingId = this.get('collection.id');

      localStorage.setItem('lastViewedCollectionId', viewingId);

      if (this.get('collection.pipelines')) {
        return this.get('collection.pipelines').map(pipeline => {
          const scm = scmService.getScm(pipeline.scmContext);
          const { id, scmRepo, prs } = pipeline;
          const { branch, rootDir } = scmRepo;
          const metrics = this.metricsMap[pipeline.id];
          const ret = {
            id,
            scmRepo,
            branch: rootDir ? `${branch}#${rootDir}` : branch,
            scm: scm.displayName,
            scmIcon: scm.iconType,
            prs
          };

          if (metrics && metrics.length) {
            const lastEvent = metrics.get('firstObject');
            const lastEventStartTime = new Date(lastEvent.createTime);
            const lastEventStartYear = lastEventStartTime.getFullYear();
            const lastEventStartMonth = (lastEventStartTime.getMonth() + 1)
              .toString()
              .padStart(2, '0');
            const lastEventStartDay = lastEventStartTime
              .getDate()
              .toString()
              .padStart(2, '0');

            ret.eventsInfo = metrics.map(event => ({
              duration: event.duration || 0,
              statusColor: getColor(event.status.toLowerCase())
            }));
            ret.lastEventInfo = {
              startTime: `${lastEventStartMonth}/${lastEventStartDay}/${lastEventStartYear}`,
              statusColor: getColor(lastEvent.status.toLowerCase()),
              durationText: lastEvent.duration ? formatTime(lastEvent.duration) : '--',
              sha: getSha(lastEvent.sha),
              icon: getIcon(lastEvent.status.toLowerCase()),
              commitMessage: lastEvent.commit.message,
              commitUrl: lastEvent.commit.url
            };
          } else {
            ret.eventsInfo = [];
            ret.lastEventInfo = {
              startTime: '--/--/----',
              statusColor: 'build-empty',
              durationText: '--',
              sha: 'Not available',
              icon: 'question-circle',
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
    removePipeline(pipelineId) {
      const collectionId = this.get('collection.id');

      return this.onRemovePipeline(+pipelineId)
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
    organize() {
      this.set('isOrganizing', true);
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
    selectSearchedPipeline(pipelineId) {
      this.setProperties({
        selectedSearchedPipelines: [...this.selectedSearchedPipelines, parseInt(pipelineId, 10)],
        searchedPipelines: this.searchedPipelines.filter(
          searchedPipeline => searchedPipeline.id !== pipelineId
        )
      });
    },
    resetView() {
      this.setProperties({
        isOrganizing: false,
        selectedPipelines: [],
        reset: true
      });
    },
    onSubmitSettingModal() {
      const { collection } = this;

      if (
        this.collectionName !== this.collection.name ||
        this.collectionDescription !== this.collection.description
      ) {
        collection.set('name', this.collectionName);
        collection.set('description', this.collectionDescription);
        collection.save();
      }

      this.send('toggleSettingModal');
    },
    toggleSettingModal() {
      this.setProperties({
        collectionName: this.collection.name,
        collectionDescription: this.collection.description,
        showSettingModal: !this.showSettingModal
      });
    },
    toggleAddPipelineModal() {
      if (this.get('showAddPipelineModal')) {
        if (this.selectedSearchedPipelines.length !== 0) {
          this.addMultipleToCollection(this.selectedSearchedPipelines, this.collection.id).then(
            () => {
              this.store.findRecord('collection', this.get('collection.id')).then(collection => {
                this.setProperties({
                  showAddPipelineModal: false,
                  searchedPipelines: [],
                  selectedSearchedPipelines: [],
                  collection
                });
              });
            }
          );
        } else {
          this.setProperties({
            showAddPipelineModal: false,
            searchedPipelines: [],
            selectedSearchedPipelines: []
          });
        }
      } else {
        this.set('showAddPipelineModal', true);
      }
    },
    updateCollectionName(name) {
      this.set('collectionName', name);
    },
    updateCollectionDescription(description) {
      this.set('collectionDescription', description);
    },
    goToDocs() {
      window.location.href = '#';
    },
    searchPipelines(query) {
      const pipelineListConfig = {
        page: 1,
        count: ENV.APP.NUM_PIPELINES_LISTED,
        sortBy: 'name',
        sort: 'ascending'
      };

      if (query) {
        pipelineListConfig.search = query;
      }

      this.store.query('pipeline', pipelineListConfig).then(pipelines => {
        this.set(
          'searchedPipelines',
          pipelines.filter(
            pipeline =>
              !this.collection.pipelineIds.includes(parseInt(pipeline.id, 10)) &&
              !this.selectedSearchedPipelines.includes(parseInt(pipeline.id, 10))
          )
        );
      });
    },
    copyLink() {
      const textArea = document.createElement('textarea');

      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('Copy');
      textArea.remove();
      this.set(
        'linkCopied',
        'The link of this collection is successfully copied to the clipboard.'
      );
    }
  }
});
