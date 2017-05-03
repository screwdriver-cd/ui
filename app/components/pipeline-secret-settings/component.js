import Ember from 'ember';

export default Ember.Component.extend({
  newName: null,
  newValue: null,
  newAllow: false,
  isButtonDisabled: true,
  errorMessage: '',
  secretsSorting: ['name'],
  sortedSecrets: Ember.computed.sort('secrets', 'secretsSorting'),
  actions: {
    /**
     * Sets disabled state of "add" button
     * @method enableButton
     */
    enableButton() {
      const isDisabled = !this.get('newName') || !this.get('newValue');

      this.set('isButtonDisabled', isDisabled);
    },
    /**
     * Kicks off create secret flow
     * @method addNewSecret
     */
    addNewSecret() {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(this.get('newName'))) {
        this.set('errorMessage', 'Secret name does not meet requirements /^[A-Z_][A-Z0-9_]*$/');

        return false;
      }

      this.get('onCreateSecret')(
        this.get('newName'), this.get('newValue'), this.get('pipeline.id'), this.get('newAllow')
      );
      this.set('newName', null);
      this.set('newValue', null);
      this.set('newAllow', false);
      this.set('isButtonDisabled', true);

      return true;
    }
  }
});
