import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'tr',
  buttonAction: 'Delete',
  newValue: null,
  originalAllowInPR: null,
  init() {
    this._super(...arguments);
    this.set('originalAllowInPR', this.get('secret').get('allowInPR'));
  },
  actions: {
    secretDidChange() {
      if (this.get('newValue')
        || this.get('originalAllowInPR') !== this.$('.allow input').prop('checked')) {
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
        if (this.get('newValue')) {
          secret.set('value', this.get('newValue'));
        }
        if (this.get('originalAllowInPR') !== this.$('.allow input').prop('checked')) {
          secret.set('allowInPR', this.$('.allow input').prop('checked'));
        }
        secret.save();
        this.set('newValue', null);
        this.set('buttonAction', 'Delete');
      }
    }
  }
});
