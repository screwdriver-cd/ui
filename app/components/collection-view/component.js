import { sort } from '@ember/object/computed';
import { computed, action } from '@ember/object';
import { isEmpty, isEqual } from '@ember/utils';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import ENV from 'screwdriver-ui/config/environment';

@classic
@tagName('')
export default class CollectionView extends Component {
  @service
  store;

  @service
  session;

  sortBy = ['scmRepo.name'];

  removePipelineError = null;

  activeViewOptionValue =
    localStorage.getItem('activeViewOptionValue') || this.viewOptions[0].value;

  get viewOptions() {
    return [
      {
        svgName: 'apps',
        value: 'Card'
      },
      {
        svgName: 'list',
        value: 'List'
      }
    ];
  }

  isOrganizing = false;

  selectedPipelines = [];

  addCollectionError = null;

  showSettingModal = false;

  showAddPipelineModal = false;

  collectionName = null;

  collectionDescription = null;

  searchedPipelines = [];

  selectedSearchedPipelines = [];

  linkCopied = '';

  pipelineRemovedMessage = '';

  reset = false;

  @computed('collection.pipelineIds.length')
  get showViewSwitch() {
    return this.collection.pipelineIds.length !== 0;
  }

  @computed('session.{data.authenticated.isGuest,isAuthenticated}')
  get collections() {
    if (
      !this.session?.isAuthenticated ||
      this.session?.data?.authenticated?.isGuest
    ) {
      return [];
    }
    const collections = this.store.peekAll('collection');

    if (collections.isLoaded) {
      return collections;
    }

    return this.store.findAll('collection');
  }

  @computed('collection.pipelineIds.length', 'session.isAuthenticated')
  get showOrganizeButton() {
    return (
      this.session.isAuthenticated && this.collection.pipelineIds.length !== 0
    );
  }

  @computed('activeViewOptionValue', 'viewOptions')
  get isListView() {
    localStorage.setItem('activeViewOptionValue', this.activeViewOptionValue);

    return this.activeViewOptionValue === this.viewOptions[1].value;
  }

  @computed('selectedPipelines.length')
  get showOperations() {
    return this.selectedPipelines.length > 0;
  }

  @computed('collection.type')
  get isDefaultCollection() {
    return this.collection.type === 'default';
  }

  @computed('collection.description')
  get description() {
    let description = this.collection?.description;

    if (!description) {
      return 'Add a description';
    }

    return description;
  }

  @sort('collectionPipelines', 'sortBy') sortedPipelines;

  @computed('sortBy')
  get sortByText() {
    switch (this.sortBy.get(0)) {
      case 'scmRepo.name':
        return 'Name';
      case 'lastEventTime:desc':
        return 'Last Event';
      default:
        return '';
    }
  }

  @computed('collection.{id,pipelines}')
  get collectionPipelines() {
    let viewingId = this.collection.id;

    localStorage.setItem('lastViewedCollectionId', viewingId);

    if (this.collection.pipelines) {
      return this.collection.pipelines;
    }

    return [];
  }

  @computed(
    'collection.{description,name}',
    'collectionDescription',
    'collectionName',
    'showSettingModal'
  )
  get isModelSaveDisabled() {
    const isDescriptionNotChanged = this.collection.description
      ? isEqual(this.collectionDescription, this.collection.description)
      : isEmpty(this.collectionDescription);

    return (
      isEmpty(this.collectionName) ||
      !(
        !isEqual(this.collectionName, this.collection.name) ||
        !isDescriptionNotChanged
      )
    );
  }

  /**
   * Action to remove a pipeline from a collection
   *
   * @param {Number} pipelineId     ID of pipeline to remove
   * @param {String} [pipelineName] Pipeline name
   * @returns {Promise}
   */
  @action
  removePipeline(pipelineId, pipelineName) {
    const collectionName = this.collection.name;
    const pipelineLabel = pipelineName ? ` ${pipelineName}` : '';
    const message = `The pipeline${pipelineLabel} has been removed from the ${collectionName} collection.`;

    return this.onRemovePipeline(+pipelineId)
      .then(() => {
        this.setProperties({
          removePipelineError: null,
          pipelineRemovedMessage: message
        });
      })
      .catch(error => {
        this.set('removePipelineError', error.errors[0].detail);
      });
  }

  @action
  removeSelectedPipelines() {
    const collectionName = this.collection.name;

    const message = `The pipelines has been removed from the ${collectionName} collection.`;

    return this.removeMultiplePipelines(
      this.selectedPipelines,
      this.collection.id
    )
      .then(() => {
        this.setProperties({
          removePipelineError: null,
          selectedPipelines: [],
          reset: true,
          isOrganizing: false,
          pipelineRemovedMessage: message
        });
      })
      .catch(error => {
        this.set('removePipelineError', error.errors[0].detail);
      });
  }

  @action
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
  }

  @action
  organize() {
    this.set('isOrganizing', true);
  }

  @action
  selectPipeline(pipelineId) {
    const newSelectedPipelines = this.selectedPipelines.slice(0);

    newSelectedPipelines.push(pipelineId);
    this.set('selectedPipelines', newSelectedPipelines);
  }

  @action
  deselectPipeline(pipelineId) {
    const idx = this.selectedPipelines.indexOf(pipelineId);
    const newSelectedPipelines = this.selectedPipelines.slice(0);

    if (idx !== -1) {
      newSelectedPipelines.splice(idx, 1);
      this.set('selectedPipelines', newSelectedPipelines);
    }
  }

  @action
  addPipelinesToCollection(collection) {
    return this.addMultipleToCollection(this.selectedPipelines, collection.id)
      .then(() => {
        this.setProperties({
          addCollectionError: null,
          selectedPipelines: [],
          reset: true,
          isOrganizing: false
        });
      })
      .catch(() => {
        this.set(
          'addCollectionError',
          `Could not add Pipeline to Collection ${collection.name}`
        );
      });
  }

  @action
  selectSearchedPipeline(pipelineId) {
    this.setProperties({
      selectedSearchedPipelines: [
        ...this.selectedSearchedPipelines,
        parseInt(pipelineId, 10)
      ],
      searchedPipelines: this.searchedPipelines.filter(
        searchedPipeline => searchedPipeline.id !== pipelineId
      )
    });
  }

  @action
  resetView() {
    this.setProperties({
      isOrganizing: false,
      selectedPipelines: [],
      reset: true
    });
  }

  @action
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
  }

  @action
  toggleSettingModal() {
    this.setProperties({
      collectionName: this.collection.name,
      collectionDescription: this.collection.description,
      showSettingModal: !this.showSettingModal
    });
  }

  @action
  toggleAddPipelineModal() {
    if (this.showAddPipelineModal) {
      if (this.selectedSearchedPipelines.length !== 0) {
        this.addMultipleToCollection(
          this.selectedSearchedPipelines,
          this.collection.id
        ).then(() => {
          this.store
            .findRecord('collection', this.collection.id)
            .then(collection => {
              this.setProperties({
                showAddPipelineModal: false,
                searchedPipelines: [],
                selectedSearchedPipelines: [],
                collection
              });
            });
        });
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
  }

  @action
  updateCollectionName(name) {
    this.set('collectionName', name);
  }

  @action
  updateCollectionDescription(description) {
    this.set('collectionDescription', description);
  }

  @action
  goToDocs() {
    window.location.href = '#';
  }

  @action
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
  }

  @action
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
