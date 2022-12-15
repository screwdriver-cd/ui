import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { schedule } from '@ember/runloop';

export default Component.extend({
  name: null,
  description: null,
  errorMessage: null,
  store: service(),
  isSaveDisabled: computed('name', {
    get() {
      return isEmpty(this.name);
    }
  }),
  actions: {
    setModal(open) {
      if (!open) {
        this.set('name', null);
        this.set('description', null);
        this.set('errorMessage', null);
      }
      this.set('showModal', open);
    },
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

            const addDirectly = this.addToCollection;

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
});
