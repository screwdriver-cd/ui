import Ember from 'ember';

export default Ember.Component.extend({
  tagName: '',
  type: 'info',
  actions: {
    clearMessage: () => {
      this.set('message', null);
    }
  }
});
