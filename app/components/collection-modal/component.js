import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { isEmpty } from '@ember/utils';
import { schedule } from '@ember/runloop';

@tagName('')
@classic
export default class CollectionModal extends Component {
  name = null;

  description = null;

  errorMessage = null;

  @service
  store;

  @computed('name')
  get isSaveDisabled() {
    return isEmpty(this.name);
  }

  @action
  setModal(open) {
    if (!open) {
      this.set('name', null);
      this.set('description', null);
      this.set('errorMessage', null);
    }
    this.set('showModal', open);
  }

  @action
  addNewCollection() {
    const newCollectionRecord = {
      name: this.name,
      type: 'normal'
    };

    if (this.description) {
      newCollectionRecord.description = this.description;
    }

    schedule('actions', () => {
      const newCollection = this.store.createRecord(
        'collection',
        newCollectionRecord
      );

      return newCollection
        .save()
        .then(() => {
          this.set('showModal', false);

          let addDirectly = this.addToCollection;

          if (addDirectly) {
            addDirectly(newCollection);
          }
        })
        .catch(error => {
          newCollection.destroyRecord();
          this.set('errorMessage', error.errors[0].detail);
        });
    });
  }
}
