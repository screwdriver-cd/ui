import Ember from 'ember';

export default Ember.Component.extend({
  type: 'info',
  actions: {
    clearMessage: () => {
      this.set('message', null);
    }
  }
});
