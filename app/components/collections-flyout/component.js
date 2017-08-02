import Ember from 'ember';

export default Ember.Component.extend({
  // Boolean whether to display create collection Modal
  showModal: false,
  // Error for failing to create a collection
  error: null,
  errorMessage: Ember.computed('error', function errorMessage() {
    const error = this.get('error');

    return error ? error.errors[0].detail : '';
  }),
  actions: {
    /**
     * Action to create a new collection
     */
    addNewCollection() {
      const name = this.get('name');
      const description = this.get('description');

      return this.get('onCreateCollection')(name, description)
        .then(() => {
          this.set('name', null);
          this.set('description', null);
          this.set('showModal', false);
        })
        .catch((error) => {
          this.set('error', error);
        });
    },
    /**
     * Action to open / close the create collection modal
     * @param {boolean} open - whether modal should be open
     */
    setModal(open) {
      this.set('showModal', open);
    }
  }
});
