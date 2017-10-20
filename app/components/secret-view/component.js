import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: 'tr',
  newValue: null,
  originalAllowInPR: null,
  buttonAction: computed('newValue', 'secret.allowInPR', 'originalAllowInPR', {
    get() {
      return (this.get('newValue')
        || this.get('originalAllowInPR') !== this.get('secret.allowInPR')) ?
        'Update' : 'Delete';
    }
  }),
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
