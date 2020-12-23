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
  sortBy: ['scmRepo.name'],
  collection: null,
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
      let viewingId = this.get('collection.id');

      localStorage.setItem('lastViewedCollectionId', viewingId);

      if (this.get('collection.pipelines')) {
        return this.get('collection.pipelines');
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
