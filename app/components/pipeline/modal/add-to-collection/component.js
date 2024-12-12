import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { createCollectionBody, getCollectionsWithoutPipeline } from './util';

export default class CollectionModalAddToCollectionModalComponent extends Component {
  @service shuttle;

  @tracked errorMessage = null;

  @tracked successMessage = null;

  @tracked newCollectionName = '';

  @tracked newCollectionDescription = '';

  @tracked selectedCollections = [];

  @tracked wasActionSuccessful = false;

  @tracked collectionsWithoutPipeline = [];

  failedToAddToCollections = [];

  constructor() {
    super(...arguments);

    const collections = this.args.collections || [];

    this.collectionsWithoutPipeline = getCollectionsWithoutPipeline(
      collections,
      this.args.pipeline.id
    );
    this.errorMessage = this.args.errorMessage;
  }

  get isSubmitButtonDisabled() {
    if (this.isAwaitingResponse) {
      return true;
    }

    return !(
      this.newCollectionName.length > 0 || this.selectedCollections.length > 0
    );
  }

  get hasCollections() {
    return this.collectionsWithoutPipeline.length > 0;
  }

  async createCollection() {
    if (this.newCollectionName.length > 0) {
      await this.shuttle
        .fetchFromApi(
          'post',
          '/collections',
          createCollectionBody(
            this.newCollectionName,
            this.newCollectionDescription,
            this.args.pipeline.id
          )
        )
        .then(() => {
          this.successMessage = `Successfully created new collection: ${this.newCollectionName}`;
          this.newCollectionName = '';
          this.newCollectionDescription = '';
        })
        .catch(() => {
          this.errorMessage = `Failed to create new collection: ${this.newCollectionName}`;
        });
    }
  }

  async addToCollections() {
    const promises = [];

    if (this.selectedCollections.length > 0) {
      this.failedToAddToCollections = [];

      this.selectedCollections.forEach(collection => {
        promises.push(
          this.shuttle
            .fetchFromApi('put', `/collections/${collection.id}`, {
              pipelineIds: collection.pipelineIds.concat(this.args.pipeline.id)
            })
            .catch(() => {
              this.failedToAddToCollections.push(collection.name);
            })
        );
      });
    }

    return Promise.all(promises);
  }

  @action
  async submitCollections() {
    this.isAwaitingResponse = true;
    this.errorMessage = null;
    this.successMessage = null;

    return new Promise(resolve => {
      Promise.allSettled([
        this.createCollection(),
        this.addToCollections()
      ]).then(() => {
        this.isAwaitingResponse = false;

        if (this.failedToAddToCollections.length > 0) {
          if (this.errorMessage) {
            this.errorMessage += `.  Also failed to add pipeline to collections: ${this.failedToAddToCollections.join(
              ', '
            )}`;
          } else {
            this.errorMessage = `Failed to add pipeline to collections: ${this.failedToAddToCollections.join(
              ', '
            )}`;
          }
        } else {
          const collectionNames = this.selectedCollections
            .map(collection => collection.name)
            .join(', ');

          if (collectionNames.length > 0) {
            if (this.successMessage) {
              this.successMessage += `.  Also added pipeline to collections: ${collectionNames}`;
            } else {
              this.successMessage = `Successfully added pipeline to collections: ${collectionNames}`;
            }

            this.selectedCollections.forEach(collection => {
              document.getElementById(
                `collection-${collection.id}`
              ).disabled = true;
            });
            this.selectedCollections = [];
          }
        }
        resolve();
      });
    });
  }
}
