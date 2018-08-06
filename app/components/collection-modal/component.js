import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { schedule } from '@ember/runloop';

export default Component.extend({
  name: null,
  description: null,
  errorMessage: null,
  store: service(),
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
      const name = this.get('name');
      const description = this.get('description');

      schedule('actions', () => {
        const newCollection = this.get('store').createRecord('collection', {
          name,
          description
        });

        return newCollection.save()
          .then(() => {
            this.set('showModal', false);

            let addDirectly = this.get('addToCollection');

            if (addDirectly) {
              addDirectly(this.get('pipelineId'), newCollection.id);
            }
          })
          .catch((error) => {
            newCollection.destroyRecord();
            this.set('errorMessage', error.errors[0].detail);
          });
      });
    }
  }
});
