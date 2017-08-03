import Ember from 'ember';

export default Ember.Component.extend({
  showModal: false,
  errorMessage: null,
  actions: {
    /**
     * Action to create a new collection
     */
    addNewCollection() {
      const name = this.get('name');
      const description = this.get('description');

      return this.get('onCreateCollection')(name, description)
        .then(() => {
          this.set('showModal', false);
        })
        .catch((error) => {
          this.set('errorMessage', error.errors[0].detail);
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
