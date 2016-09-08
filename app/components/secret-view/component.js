import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'tr',
  buttonAction: 'Delete',
  newValue: null,
  actions: {
    newValueDidChange() {
      if (this.get('newValue')) {
        this.set('buttonAction', 'Update');
      } else {
        this.set('buttonAction', 'Delete');
      }
    },
    modifySecret() {
      const secret = this.get('secret');

      if (this.get('buttonAction') === 'Delete') {
        secret.destroyRecord();
      } else {
        secret.set('value', this.get('newValue'));
        secret.save();
        this.set('newValue', null);
        this.set('buttonAction', 'Delete');
      }
    }
  }
});
