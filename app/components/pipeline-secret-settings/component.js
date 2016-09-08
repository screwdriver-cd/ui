import Ember from 'ember';

export default Ember.Component.extend({
  newName: null,
  newValue: null,
  isButtonDisabled: true,
  actions: {
    enableButton() {
      const isDisabled = !this.get('newName') || !this.get('newValue');

      this.set('isButtonDisabled', isDisabled);
    },
    addNewSecret() {
      this.get('onCreateSecret')(
        this.get('newName'), this.get('newValue'), this.get('pipeline.id')
      );
      this.set('newName', null);
      this.set('newValue', null);
      this.set('isButtonDisabled', true);
    }
  }
});
