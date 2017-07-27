import Ember from 'ember';

export default Ember.Component.extend({
  type: 'info',
  actions: {
    clearMessage: function clearMessage() {
      this.set('message', null);
    }
  }
});
