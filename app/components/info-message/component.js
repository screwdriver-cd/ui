import Component from '@ember/component';

export default Component.extend({
  type: 'info',
  actions: {
    clearMessage: function clearMessage() {
      this.set('message', null);
    }
  }
});
