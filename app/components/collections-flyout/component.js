import Ember from 'ember';

export default Ember.Component.extend({
  collections: Ember.computed('store', {
    get() {
      return this.get('store').findAll('collection');
    }
  }),
  errorMessage: null,
  showModal: false,
  store: Ember.inject.service(),
  actions: {
    /**
     * Action to create a new collection
     */
    addNewCollection() {
      const name = this.get('name');
      const description = this.get('description');

      Ember.run.schedule('actions', () => {
        const newCollection = this.get('store').createRecord('collection', {
          name,
          description
        });

        return newCollection.save()
          .then(() => {
            this.set('showModal', false);
          })
          .catch((error) => {
            newCollection.destroyRecord();
            this.set('errorMessage', error.errors[0].detail);
          });
      });
    },
    /**
     * Action to open / close the create collection modal
     * @param {boolean} open - whether modal should be open
     */
    setModal(open) {
      if (!open) {
        this.set('name', null);
        this.set('description', null);
        this.set('errorMessage', null);
      }
      this.set('showModal', open);
    }
  }
});
