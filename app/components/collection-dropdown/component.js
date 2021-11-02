import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import { filter } from '@ember/object/computed';
import Component from '@ember/component';

@classic
@tagName('')
export default class CollectionDropdown extends Component {
  showCollectionModal = false;

  addCollectionError = null;

  addCollectionSuccess = null;

  pipeline = null;

  buttonText = undefined;

  buttonClass = undefined;

  @filter('collections.[]', collection => collection.type !== 'default')
  normalCollections;

  @action
  openModal() {
    this.set('showCollectionModal', true);
  }

  @action
  addPipelineToCollection(collection) {
    if (this.pipeline && this.addToCollection) {
      return this.addToCollection(+this.pipeline.id, collection)
        .then(() => {
          this.setProperties({
            addCollectionError: null,
            addCollectionSuccess: `Successfully added Pipeline to ${collection.name}`
          });
        })
        .catch(() => {
          this.setProperties({
            addCollectionError: `Could not add Pipeline to ${collection.name}`,
            addCollectionSuccess: null
          });
        });
    }

    return this.addMultipleToCollection(collection)
      .then(() => {
        this.setProperties({
          addCollectionError: null,
          addCollectionSuccess: `Successfully added all Pipelines to ${collection.name}`
        });
      })
      .catch(() => {
        this.setProperties({
          addCollectionError: `Could not add all Pipelines to ${collection.name}`,
          addCollectionSuccess: null
        });
      });
  }
}
