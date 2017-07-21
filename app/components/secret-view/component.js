import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'tr',
  buttonAction: Ember.computed('newValue', 'secret.allowInPR', 'originalAllowInPR', {
    get() {
      return (this.get('newValue')
        || this.get('originalAllowInPR') !== this.get('secret.allowInPR')) ?
        'Update' : 'Delete';
    }
  }),
  newValue: null,
  originalAllowInPR: null,
  init() {
    this._super(...arguments);
    this.set('originalAllowInPR', this.get('secret.allowInPR'));
  },
  actions: {
    modifySecret() {
      const secret = this.get('secret');

      if (this.get('buttonAction') === 'Delete') {
        secret.destroyRecord();
      } else {
        if (this.get('newValue')) {
          secret.set('value', this.get('newValue'));
        }
        secret.save();
        this.set('newValue', null);
        this.set('originalAllowInPR', secret.get('allowInPR'));
      }
    }
  }
});
